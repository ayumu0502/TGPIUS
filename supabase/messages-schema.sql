-- Run this in the Supabase SQL Editor AFTER admin-schema.sql

create type public.message_type as enum ('text', 'image', 'file');

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  last_read_at timestamptz not null default now(),
  typing_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null default '',
  message_type public.message_type not null default 'text',
  file_url text,
  file_name text,
  file_mime text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check (char_length(content) <= 2000)
);

create table if not exists public.message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  read_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists conversation_members_user_id_idx
  on public.conversation_members (user_id);

create index if not exists conversation_members_conversation_id_idx
  on public.conversation_members (conversation_id);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id);

create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

create index if not exists messages_content_search_idx
  on public.messages using gin (to_tsvector('simple', content));

create index if not exists message_reads_message_id_idx
  on public.message_reads (message_id);

create index if not exists message_reads_user_id_idx
  on public.message_reads (user_id);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_member(uuid) to authenticated;

drop policy if exists "Members can view conversations" on public.conversations;
create policy "Members can view conversations"
  on public.conversations for select
  using (public.is_conversation_member(id));

drop policy if exists "Members can view conversation members" on public.conversation_members;
create policy "Members can view conversation members"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id));

drop policy if exists "Members can update own membership" on public.conversation_members;
create policy "Members can update own membership"
  on public.conversation_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Members can view messages" on public.messages;
create policy "Members can view messages"
  on public.messages for select
  using (public.is_conversation_member(conversation_id));

drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id)
  );

drop policy if exists "Senders can soft delete messages" on public.messages;
create policy "Senders can soft delete messages"
  on public.messages for update
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

drop policy if exists "Members can view message reads" on public.message_reads;
create policy "Members can view message reads"
  on public.message_reads for select
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
        and public.is_conversation_member(m.conversation_id)
    )
  );

drop policy if exists "Members can mark messages read" on public.message_reads;
create policy "Members can mark messages read"
  on public.message_reads for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.messages m
      where m.id = message_id
        and public.is_conversation_member(m.conversation_id)
        and m.sender_id <> auth.uid()
    )
  );

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
begin
  if auth.uid() is null or p_other_user_id is null then
    return false;
  end if;

  if auth.uid() = p_other_user_id then
    return false;
  end if;

  select account_type into v_my_type from public.profiles where id = auth.uid();
  select account_type into v_other_type from public.profiles where id = p_other_user_id;

  if v_my_type is null or v_other_type is null then
    return false;
  end if;

  if v_other_type = 'athlete' and v_my_type in ('fan', 'sponsor') then
    return exists (
      select 1 from public.profiles
      where id = p_other_user_id
        and athlete_review_status = 'approved'
        and coalesce(is_suspended, false) = false
    );
  end if;

  if v_my_type = 'athlete' and v_other_type in ('fan', 'sponsor') then
    return exists (
      select 1 from public.profiles
      where id = auth.uid()
        and athlete_review_status = 'approved'
        and coalesce(is_suspended, false) = false
    );
  end if;

  return false;
end;
$$;

grant execute on function public.can_message_user(uuid) to authenticated;

create or replace function public.get_or_create_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
begin
  if not public.can_message_user(p_other_user_id) then
    raise exception 'INVALID_MESSAGE_PAIR';
  end if;

  select cm1.conversation_id
  into v_conversation_id
  from public.conversation_members cm1
  join public.conversation_members cm2
    on cm1.conversation_id = cm2.conversation_id
  where cm1.user_id = auth.uid()
    and cm2.user_id = p_other_user_id
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations default values
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (v_conversation_id, auth.uid()),
    (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

grant execute on function public.get_or_create_conversation(uuid) to authenticated;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_conversation_member(p_conversation_id) then
    raise exception 'NOT_MEMBER';
  end if;

  insert into public.message_reads (message_id, user_id)
  select m.id, auth.uid()
  from public.messages m
  where m.conversation_id = p_conversation_id
    and m.sender_id <> auth.uid()
    and m.deleted_at is null
  on conflict (message_id, user_id) do nothing;

  update public.conversation_members
  set last_read_at = now()
  where conversation_id = p_conversation_id
    and user_id = auth.uid();
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;

create or replace function public.set_typing_status(
  p_conversation_id uuid,
  p_is_typing boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_conversation_member(p_conversation_id) then
    raise exception 'NOT_MEMBER';
  end if;

  update public.conversation_members
  set typing_at = case when p_is_typing then now() else null end
  where conversation_id = p_conversation_id
    and user_id = auth.uid();
end;
$$;

grant execute on function public.set_typing_status(uuid, boolean) to authenticated;

create or replace function public.update_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  update public.profiles
  set last_seen_at = now(), updated_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.update_last_seen() to authenticated;

create or replace function public.touch_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can upload message attachments" on storage.objects;
create policy "Members can upload message attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'message-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Anyone can view message attachments" on storage.objects;
create policy "Anyone can view message attachments"
  on storage.objects for select
  using (bucket_id = 'message-attachments');

drop policy if exists "Users can delete own message attachments" on storage.objects;
create policy "Users can delete own message attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'message-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

alter table public.messages replica identity full;
alter table public.conversation_members replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversation_members;
exception
  when duplicate_object then null;
end $$;
