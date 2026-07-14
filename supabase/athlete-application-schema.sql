-- Athlete application & review system for TGPLUS
-- Run in Supabase SQL Editor AFTER admin-schema.sql and profile-fields-schema.sql

-- ---------------------------------------------------------------------------
-- Enum & profile column
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'athlete_review_status') then
    create type public.athlete_review_status as enum (
      'not_applied',  -- 未申請
      'pending',      -- 審査中
      'approved',     -- 承認
      'rejected',     -- 却下
      'resubmit',     -- 再提出依頼
      'suspended'     -- 利用停止（アスリート機能）
    );
  end if;
end $$;

alter table public.profiles
  add column if not exists athlete_review_status public.athlete_review_status;

alter table public.profiles
  add column if not exists career_history text not null default '';

-- Existing athletes who already use the platform → auto-approve
update public.profiles
set athlete_review_status = 'approved'::public.athlete_review_status
where account_type = 'athlete'
  and athlete_review_status is null;

-- Non-athletes: leave null
update public.profiles
set athlete_review_status = 'not_applied'::public.athlete_review_status
where account_type = 'athlete'
  and athlete_review_status is null;

create index if not exists profiles_athlete_review_status_idx
  on public.profiles (athlete_review_status)
  where account_type = 'athlete';

-- New signups: athletes start as not_applied
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_type public.account_type;
begin
  v_account_type := coalesce(
    (new.raw_user_meta_data->>'account_type')::public.account_type,
    'fan'::public.account_type
  );

  insert into public.profiles (
    id, name, email, account_type, athlete_review_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    v_account_type,
    case
      when v_account_type = 'athlete' then 'not_applied'::public.athlete_review_status
      else null
    end
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    account_type = excluded.account_type,
    athlete_review_status = coalesce(
      public.profiles.athlete_review_status,
      excluded.athlete_review_status
    ),
    updated_at = now();

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Application tables
-- ---------------------------------------------------------------------------

create table if not exists public.athlete_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  sport text not null,
  team text not null default '',
  region text not null default '',
  career_history text not null default '',
  achievements text not null default '',
  bio text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  x_url text not null default '',
  profile_image_url text,
  identity_doc_path text not null,
  status public.athlete_review_status not null default 'pending',
  review_note text not null default '',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists athlete_applications_user_id_idx
  on public.athlete_applications (user_id, submitted_at desc);

create index if not exists athlete_applications_status_idx
  on public.athlete_applications (status, submitted_at desc);

alter table public.athlete_applications enable row level security;

drop policy if exists "Users can view own applications" on public.athlete_applications;
create policy "Users can view own applications"
  on public.athlete_applications for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all applications" on public.athlete_applications;
create policy "Admins can view all applications"
  on public.athlete_applications for select
  using (public.is_admin());

create table if not exists public.athlete_application_audit_log (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.athlete_applications(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null
    check (action in ('submitted', 'approved', 'rejected', 'resubmit_requested', 'suspended', 'note')),
  previous_status public.athlete_review_status,
  new_status public.athlete_review_status,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists athlete_application_audit_log_user_idx
  on public.athlete_application_audit_log (user_id, created_at desc);

alter table public.athlete_application_audit_log enable row level security;

drop policy if exists "Admins can view application audit log" on public.athlete_application_audit_log;
create policy "Admins can view application audit log"
  on public.athlete_application_audit_log for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Identity document storage (private — admin read only)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'athlete-identity-docs',
  'athlete-identity-docs',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own identity docs" on storage.objects;
create policy "Users can upload own identity docs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'athlete-identity-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own identity docs" on storage.objects;
create policy "Users can update own identity docs"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'athlete-identity-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Admins can view identity docs" on storage.objects;
create policy "Admins can view identity docs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'athlete-identity-docs'
    and public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Submit application (applicant)
-- ---------------------------------------------------------------------------

create or replace function public.submit_athlete_application(
  p_full_name text,
  p_sport text,
  p_team text default '',
  p_region text default '',
  p_career_history text default '',
  p_achievements text default '',
  p_bio text default '',
  p_instagram_url text default '',
  p_tiktok_url text default '',
  p_x_url text default '',
  p_profile_image_url text default null,
  p_identity_doc_path text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_account_type public.account_type;
  v_status public.athlete_review_status;
  v_application_id uuid;
  v_name text := trim(coalesce(p_full_name, ''));
  v_sport text := trim(coalesce(p_sport, ''));
  v_doc_path text := trim(coalesce(p_identity_doc_path, ''));
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select account_type, athlete_review_status
  into v_account_type, v_status
  from public.profiles
  where id = v_user_id;

  if v_account_type is distinct from 'athlete' then
    raise exception 'NOT_ATHLETE_ACCOUNT';
  end if;

  if v_status not in ('not_applied', 'rejected', 'resubmit') then
    raise exception 'APPLICATION_NOT_ALLOWED';
  end if;

  if v_name = '' then raise exception 'FULL_NAME_REQUIRED'; end if;
  if v_sport = '' then raise exception 'SPORT_REQUIRED'; end if;
  if v_doc_path = '' then raise exception 'IDENTITY_DOC_REQUIRED'; end if;
  if v_doc_path not like v_user_id::text || '/%' then
    raise exception 'INVALID_IDENTITY_DOC_PATH';
  end if;

  insert into public.athlete_applications (
    user_id,
    full_name,
    sport,
    team,
    region,
    career_history,
    achievements,
    bio,
    instagram_url,
    tiktok_url,
    x_url,
    profile_image_url,
    identity_doc_path,
    status,
    submitted_at
  )
  values (
    v_user_id,
    v_name,
    v_sport,
    trim(coalesce(p_team, '')),
    trim(coalesce(p_region, '')),
    trim(coalesce(p_career_history, '')),
    trim(coalesce(p_achievements, '')),
    trim(coalesce(p_bio, '')),
    trim(coalesce(p_instagram_url, '')),
    trim(coalesce(p_tiktok_url, '')),
    trim(coalesce(p_x_url, '')),
    nullif(trim(coalesce(p_profile_image_url, '')), ''),
    v_doc_path,
    'pending',
    now()
  )
  returning id into v_application_id;

  update public.profiles
  set
    athlete_review_status = 'pending',
    updated_at = now()
  where id = v_user_id;

  insert into public.athlete_application_audit_log (
    application_id, user_id, admin_id, action, previous_status, new_status, note
  )
  values (
    v_application_id,
    v_user_id,
    v_user_id,
    'submitted',
    v_status,
    'pending',
    '選手申請を提出'
  );

  return v_application_id;
end;
$$;

revoke all on function public.submit_athlete_application(text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_athlete_application(text, text, text, text, text, text, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin review
-- ---------------------------------------------------------------------------

create or replace function public.admin_review_athlete_application(
  p_application_id uuid,
  p_action text,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_app public.athlete_applications%rowtype;
  v_prev_status public.athlete_review_status;
  v_new_status public.athlete_review_status;
  v_note text := trim(coalesce(p_note, ''));
  v_action text := lower(trim(coalesce(p_action, '')));
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select * into v_app
  from public.athlete_applications
  where id = p_application_id;

  if not found then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;

  select athlete_review_status into v_prev_status
  from public.profiles
  where id = v_app.user_id;

  if v_action = 'approve' then
    v_new_status := 'approved';

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    update public.profiles
    set
      name = v_app.full_name,
      sport = v_app.sport,
      team = v_app.team,
      region = v_app.region,
      career_history = v_app.career_history,
      achievements = v_app.achievements,
      bio = v_app.bio,
      instagram_url = v_app.instagram_url,
      tiktok_url = v_app.tiktok_url,
      x_url = v_app.x_url,
      avatar_url = coalesce(v_app.profile_image_url, avatar_url),
      athlete_review_status = v_new_status,
      is_verified = true,
      updated_at = now()
    where id = v_app.user_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      '選手申請が承認されました',
      'アスリートとしての活動を開始できます。',
      '/athlete/dashboard',
      p_application_id
    );

  elsif v_action = 'reject' then
    v_new_status := 'rejected';

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    update public.profiles
    set athlete_review_status = v_new_status, updated_at = now()
    where id = v_app.user_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      '選手申請が却下されました',
      case when v_note <> '' then v_note else '詳細は申請ページをご確認ください。' end,
      '/athlete/apply',
      p_application_id
    );

  elsif v_action = 'resubmit_request' then
    v_new_status := 'resubmit';

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    update public.profiles
    set athlete_review_status = v_new_status, updated_at = now()
    where id = v_app.user_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      '選手申請の再提出をお願いします',
      case when v_note <> '' then v_note else '申請内容を修正のうえ、再提出してください。' end,
      '/athlete/apply',
      p_application_id
    );

  elsif v_action = 'suspend' then
    v_new_status := 'suspended';

    update public.profiles
    set athlete_review_status = v_new_status, updated_at = now()
    where id = v_app.user_id;

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      'アスリート機能が利用停止されました',
      case when v_note <> '' then v_note else '運営にお問い合わせください。' end,
      '/athlete/apply',
      p_application_id
    );

  else
    raise exception 'INVALID_ACTION';
  end if;

  insert into public.athlete_application_audit_log (
    application_id, user_id, admin_id, action, previous_status, new_status, note
  )
  values (
    p_application_id,
    v_app.user_id,
    v_admin_id,
    case v_action
      when 'approve' then 'approved'
      when 'reject' then 'rejected'
      when 'resubmit_request' then 'resubmit_requested'
      when 'suspend' then 'suspended'
      else v_action
    end,
    v_prev_status,
    v_new_status,
    v_note
  );
end;
$$;

revoke all on function public.admin_review_athlete_application(uuid, text, text) from public;
grant execute on function public.admin_review_athlete_application(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- search_athletes: approved athletes only
-- ---------------------------------------------------------------------------

create or replace function public.search_athletes(
  p_query text default '',
  p_sport text default null,
  p_region text default null,
  p_gender text default null,
  p_min_followers integer default null,
  p_sort text default 'relevance',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  sport text,
  team text,
  region text,
  gender text,
  avatar_url text,
  account_type public.account_type,
  follower_count bigint,
  gift_total bigint,
  recent_gift_total bigint,
  post_count bigint,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  with athlete_stats as (
    select
      p.id,
      p.name,
      p.sport,
      p.team,
      p.region,
      p.gender,
      p.avatar_url,
      p.account_type,
      coalesce((
        select count(*)::bigint from public.follows f where f.following_id = p.id
      ), 0) as follower_count,
      coalesce((
        select sum(g.amount)::bigint from public.gifts g where g.receiver_id = p.id
      ), 0) as gift_total,
      coalesce((
        select sum(g.amount)::bigint
        from public.gifts g
        where g.receiver_id = p.id
          and g.created_at > now() - interval '7 days'
      ), 0) as recent_gift_total,
      coalesce((
        select count(*)::bigint from public.posts po where po.user_id = p.id
      ), 0) as post_count,
      p.created_at
    from public.profiles p
    where p.account_type = 'athlete'
      and p.athlete_review_status = 'approved'
      and coalesce(p.is_suspended, false) = false
  )
  select *
  from athlete_stats a
  where (
    coalesce(trim(p_query), '') = ''
    or a.name ilike '%' || trim(p_query) || '%'
    or a.sport ilike '%' || trim(p_query) || '%'
    or a.region ilike '%' || trim(p_query) || '%'
    or a.team ilike '%' || trim(p_query) || '%'
  )
  and (p_sport is null or trim(p_sport) = '' or a.sport ilike '%' || trim(p_sport) || '%')
  and (p_region is null or trim(p_region) = '' or a.region ilike '%' || trim(p_region) || '%')
  and (p_gender is null or trim(p_gender) = '' or a.gender = trim(p_gender))
  and (p_min_followers is null or a.follower_count >= p_min_followers)
  order by
    case when p_sort = 'followers' then a.follower_count end desc nulls last,
    case when p_sort = 'gifts' then a.gift_total end desc nulls last,
    case when p_sort = 'trending' then a.recent_gift_total end desc nulls last,
    case when p_sort = 'newest' then extract(epoch from a.created_at) end desc nulls last,
    a.follower_count desc,
    a.name asc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- send_gift: receiver must be approved athlete
-- TODO: platform fee rate is provisional — see src/lib/config/revenue-sharing.ts
-- ---------------------------------------------------------------------------

create or replace function public.send_gift(
  p_receiver_id uuid,
  p_amount integer,
  p_message text default '',
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_sender_type public.account_type;
  v_receiver_type public.account_type;
  v_receiver_status public.athlete_review_status;
  v_balance integer;
  v_gift_id uuid;
  v_message text := coalesce(trim(p_message), '');
  -- TODO: provisional platform fee — not final revenue-sharing spec
  v_platform_fee integer;
  v_net integer;
  v_existing_gift uuid;
begin
  if v_sender_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_amount not in (100, 300, 500, 1000, 3000, 10000) then raise exception 'INVALID_AMOUNT'; end if;
  if char_length(v_message) > 200 then raise exception 'MESSAGE_TOO_LONG'; end if;
  if v_sender_id = p_receiver_id then raise exception 'SELF_GIFT'; end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select gift_id into v_existing_gift
    from public.gift_idempotency
    where sender_id = v_sender_id and idempotency_key = trim(p_idempotency_key);

    if v_existing_gift is not null then
      return v_existing_gift;
    end if;
  end if;

  select account_type, point_balance into v_sender_type, v_balance
  from public.profiles where id = v_sender_id;

  if v_sender_type is null or v_sender_type <> 'fan' then raise exception 'SENDER_NOT_FAN'; end if;

  select account_type, athlete_review_status
  into v_receiver_type, v_receiver_status
  from public.profiles where id = p_receiver_id;

  if v_receiver_type is null or v_receiver_type <> 'athlete' then
    raise exception 'RECEIVER_NOT_ATHLETE';
  end if;
  if v_receiver_status is distinct from 'approved' then
    raise exception 'RECEIVER_NOT_APPROVED';
  end if;
  if v_balance < p_amount then raise exception 'INSUFFICIENT_BALANCE'; end if;

  v_platform_fee := floor(p_amount * 0.1);
  v_net := p_amount - v_platform_fee;

  perform set_config('app.allow_point_update', 'true', true);

  update public.profiles
  set point_balance = point_balance - p_amount, updated_at = now()
  where id = v_sender_id;

  update public.profiles
  set earnings_balance = earnings_balance + v_net, updated_at = now()
  where id = p_receiver_id;

  insert into public.gifts (sender_id, receiver_id, amount, message)
  values (v_sender_id, p_receiver_id, p_amount, v_message)
  returning id into v_gift_id;

  insert into public.athlete_earnings_ledger (
    athlete_id, source_type, source_id, gross_amount, platform_fee, net_amount, status, description
  )
  values (
    p_receiver_id, 'gift', v_gift_id, p_amount, v_platform_fee, v_net, 'settled', 'ギフト受取'
  );

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    insert into public.gift_idempotency (sender_id, idempotency_key, gift_id)
    values (v_sender_id, trim(p_idempotency_key), v_gift_id)
    on conflict (sender_id, idempotency_key) do nothing;
  end if;

  return v_gift_id;
end;
$$;

revoke all on function public.send_gift(uuid, integer, text, text) from public;
grant execute on function public.send_gift(uuid, integer, text, text) to authenticated;
