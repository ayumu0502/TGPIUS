-- DM hotfix: approved-athlete gating, storage RLS, blocks/reports
-- Run in Supabase SQL Editor AFTER messages-schema.sql and athlete-application-schema.sql

-- ---------------------------------------------------------------------------
-- Block & report tables
-- ---------------------------------------------------------------------------

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocker_idx
  on public.user_blocks (blocker_id);

create index if not exists user_blocks_blocked_idx
  on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can view own blocks" on public.user_blocks;
create policy "Users can view own blocks"
  on public.user_blocks for select
  using (auth.uid() = blocker_id);

drop policy if exists "Admins can view all blocks" on public.user_blocks;
create policy "Admins can view all blocks"
  on public.user_blocks for select
  using (public.is_admin());

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default '',
  context_type text not null default 'dm'
    check (context_type in ('dm', 'profile', 'post', 'comment', 'other')),
  context_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists user_reports_status_idx
  on public.user_reports (status, created_at desc);

alter table public.user_reports enable row level security;

drop policy if exists "Users can view own reports" on public.user_reports;
create policy "Users can view own reports"
  on public.user_reports for select
  using (auth.uid() = reporter_id);

drop policy if exists "Admins can view all reports" on public.user_reports;
create policy "Admins can view all reports"
  on public.user_reports for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Block / report RPCs
-- ---------------------------------------------------------------------------

create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_blocked_id is null or auth.uid() = p_blocked_id then
    raise exception 'INVALID_BLOCK_TARGET';
  end if;

  if not exists (select 1 from public.profiles where id = p_blocked_id) then
    raise exception 'USER_NOT_FOUND';
  end if;

  insert into public.user_blocks (blocker_id, blocked_id)
  values (auth.uid(), p_blocked_id)
  on conflict (blocker_id, blocked_id) do nothing;
end;
$$;

grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  delete from public.user_blocks
  where blocker_id = auth.uid() and blocked_id = p_blocked_id;
end;
$$;

grant execute on function public.unblock_user(uuid) to authenticated;

create or replace function public.report_user(
  p_reported_id uuid,
  p_reason text default '',
  p_context_type text default 'dm',
  p_context_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_reported_id is null or auth.uid() = p_reported_id then
    raise exception 'INVALID_REPORT_TARGET';
  end if;

  if not exists (select 1 from public.profiles where id = p_reported_id) then
    raise exception 'USER_NOT_FOUND';
  end if;

  if char_length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'REASON_REQUIRED';
  end if;

  insert into public.user_reports (
    reporter_id, reported_id, reason, context_type, context_id
  )
  values (
    auth.uid(),
    p_reported_id,
    trim(p_reason),
    coalesce(nullif(trim(p_context_type), ''), 'dm'),
    p_context_id
  )
  returning id into v_report_id;

  return v_report_id;
end;
$$;

grant execute on function public.report_user(uuid, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- can_message_user: approved athletes, suspended, blocks
-- ---------------------------------------------------------------------------

create or replace function public.can_message_user(p_other_user_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_my_type public.account_type;
  v_other_type public.account_type;
  v_my_status public.athlete_review_status;
  v_other_status public.athlete_review_status;
  v_my_suspended boolean;
  v_other_suspended boolean;
begin
  if auth.uid() is null or p_other_user_id is null then
    return false;
  end if;

  if auth.uid() = p_other_user_id then
    return false;
  end if;

  if exists (
    select 1 from public.user_blocks
    where (blocker_id = auth.uid() and blocked_id = p_other_user_id)
       or (blocker_id = p_other_user_id and blocked_id = auth.uid())
  ) then
    return false;
  end if;

  select
    account_type,
    athlete_review_status,
    coalesce(is_suspended, false)
  into v_my_type, v_my_status, v_my_suspended
  from public.profiles
  where id = auth.uid();

  select
    account_type,
    athlete_review_status,
    coalesce(is_suspended, false)
  into v_other_type, v_other_status, v_other_suspended
  from public.profiles
  where id = p_other_user_id;

  if v_my_type is null or v_other_type is null then
    return false;
  end if;

  if v_my_suspended or v_other_suspended then
    return false;
  end if;

  if v_other_type = 'athlete' and v_my_type in ('fan', 'sponsor') then
    return v_other_status = 'approved';
  end if;

  if v_my_type = 'athlete' and v_other_type in ('fan', 'sponsor') then
    return v_my_status = 'approved';
  end if;

  return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage RLS fix: path is {userId}/{conversationId}/{file}
-- ---------------------------------------------------------------------------

drop policy if exists "Members can upload message attachments" on storage.objects;
create policy "Members can upload message attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'message-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own message attachments" on storage.objects;
create policy "Users can delete own message attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'message-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- Realtime: message_reads for live read receipts
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'message_reads'
  ) then
    alter publication supabase_realtime add table public.message_reads;
  end if;
exception
  when others then null;
end $$;
