-- Athlete invite, provisional profiles, and organizations for TGPLUS
-- Run AFTER athlete-application-schema.sql

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_type') then
    create type public.organization_type as enum (
      'agency',  -- 事務所
      'team',    -- チーム
      'school',  -- 学校
      'club'     -- クラブ
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_status') then
    create type public.organization_status as enum (
      'active',
      'inactive',
      'hidden'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'membership_status') then
    create type public.membership_status as enum (
      'active',
      'left',
      'suspended',
      'hidden'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'athlete_invite_status') then
    create type public.athlete_invite_status as enum (
      'draft',       -- 招待未送信
      'invited',     -- 招待済み
      'completed',   -- 登録完了
      'cancelled',   -- 招待取消
      'expired'      -- 期限切れ
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Profile extensions
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists agency text not null default '';

alter table public.profiles
  add column if not exists is_profile_public boolean not null default true;

alter table public.profiles
  add column if not exists career_history text not null default '';

alter table public.profiles
  add column if not exists invited_via_provisional_id uuid;

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type public.organization_type not null,
  description text not null default '',
  region text not null default '',
  status public.organization_status not null default 'active',
  admin_note text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_type_status_idx
  on public.organizations (org_type, status, name);

alter table public.organizations enable row level security;

drop policy if exists organizations_admin_all on public.organizations;
create policy organizations_admin_all on public.organizations
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Provisional athlete profiles (draft before registration)
-- ---------------------------------------------------------------------------

create table if not exists public.athlete_provisional_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  sport text not null,
  team text not null default '',
  agency text not null default '',
  region text not null default '',
  career_history text not null default '',
  achievements text not null default '',
  bio text not null default '',
  goals text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  x_url text not null default '',
  youtube_url text not null default '',
  avatar_url text,
  cover_url text,
  is_public boolean not null default false,
  review_status public.athlete_review_status not null default 'approved',
  admin_note text not null default '',
  organization_id uuid references public.organizations(id) on delete set null,
  linked_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists athlete_provisional_profiles_email_idx
  on public.athlete_provisional_profiles (lower(email));

create index if not exists athlete_provisional_profiles_linked_user_idx
  on public.athlete_provisional_profiles (linked_user_id)
  where linked_user_id is not null;

alter table public.athlete_provisional_profiles enable row level security;

drop policy if exists athlete_provisional_profiles_admin_all on public.athlete_provisional_profiles;
create policy athlete_provisional_profiles_admin_all on public.athlete_provisional_profiles
  for all using (public.is_admin())
  with check (public.is_admin());

drop policy if exists athlete_provisional_profiles_self_read on public.athlete_provisional_profiles;
create policy athlete_provisional_profiles_self_read on public.athlete_provisional_profiles
  for select using (linked_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Invites
-- ---------------------------------------------------------------------------

create table if not exists public.athlete_invites (
  id uuid primary key default gen_random_uuid(),
  provisional_profile_id uuid not null references public.athlete_provisional_profiles(id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  status public.athlete_invite_status not null default 'draft',
  sent_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  resent_count integer not null default 0,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (token_hash)
);

create index if not exists athlete_invites_provisional_idx
  on public.athlete_invites (provisional_profile_id, created_at desc);

create index if not exists athlete_invites_email_idx
  on public.athlete_invites (lower(email), status);

alter table public.athlete_invites enable row level security;

drop policy if exists athlete_invites_admin_all on public.athlete_invites;
create policy athlete_invites_admin_all on public.athlete_invites
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Organization memberships
-- ---------------------------------------------------------------------------

create table if not exists public.athlete_organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_user_id uuid references public.profiles(id) on delete cascade,
  provisional_profile_id uuid references public.athlete_provisional_profiles(id) on delete cascade,
  membership_status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_org_membership_target_chk check (
    athlete_user_id is not null or provisional_profile_id is not null
  )
);

create index if not exists athlete_org_memberships_org_idx
  on public.athlete_organization_memberships (organization_id, membership_status);

create index if not exists athlete_org_memberships_user_idx
  on public.athlete_organization_memberships (athlete_user_id)
  where athlete_user_id is not null;

alter table public.athlete_organization_memberships enable row level security;

drop policy if exists athlete_org_memberships_admin_all on public.athlete_organization_memberships;
create policy athlete_org_memberships_admin_all on public.athlete_organization_memberships
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.hash_invite_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(digest(p_token, 'sha256'), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin_create_provisional_athlete
-- ---------------------------------------------------------------------------

create or replace function public.admin_create_provisional_athlete(
  p_email text,
  p_full_name text,
  p_sport text,
  p_team text default '',
  p_agency text default '',
  p_region text default '',
  p_career_history text default '',
  p_achievements text default '',
  p_bio text default '',
  p_goals text default '',
  p_is_public boolean default false,
  p_review_status public.athlete_review_status default 'approved',
  p_admin_note text default '',
  p_organization_id uuid default null,
  p_token text default null,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_provisional_id uuid;
  v_invite_id uuid;
  v_token text;
  v_expires timestamptz;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  if trim(coalesce(p_email, '')) = '' or trim(coalesce(p_full_name, '')) = '' or trim(coalesce(p_sport, '')) = '' then
    raise exception 'REQUIRED_FIELDS';
  end if;

  insert into public.athlete_provisional_profiles (
    email, full_name, sport, team, agency, region,
    career_history, achievements, bio, goals,
    is_public, review_status, admin_note, organization_id, created_by
  ) values (
    lower(trim(p_email)),
    trim(p_full_name),
    trim(p_sport),
    coalesce(p_team, ''),
    coalesce(p_agency, ''),
    coalesce(p_region, ''),
    coalesce(p_career_history, ''),
    coalesce(p_achievements, ''),
    coalesce(p_bio, ''),
    coalesce(p_goals, ''),
    coalesce(p_is_public, false),
    coalesce(p_review_status, 'approved'::public.athlete_review_status),
    coalesce(p_admin_note, ''),
    p_organization_id,
    v_admin_id
  )
  returning id into v_provisional_id;

  if p_organization_id is not null then
    insert into public.athlete_organization_memberships (
      organization_id, provisional_profile_id, membership_status, updated_by
    ) values (
      p_organization_id, v_provisional_id, 'active', v_admin_id
    );
  end if;

  v_token := coalesce(nullif(trim(p_token), ''), encode(gen_random_bytes(24), 'hex'));
  v_expires := coalesce(p_expires_at, now() + interval '14 days');

  insert into public.athlete_invites (
    provisional_profile_id, email, token_hash, expires_at, status, invited_by
  ) values (
    v_provisional_id,
    lower(trim(p_email)),
    public.hash_invite_token(v_token),
    v_expires,
    'draft',
    v_admin_id
  )
  returning id into v_invite_id;

  perform public.admin_log_action(
    'athlete_provisional_created',
    'athlete_provisional',
    v_provisional_id,
    jsonb_build_object('email', lower(trim(p_email)), 'invite_id', v_invite_id),
    ''
  );

  return v_provisional_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_athlete_invite_public (for registration page)
-- ---------------------------------------------------------------------------

create or replace function public.get_athlete_invite_public(p_token text)
returns table (
  invite_id uuid,
  email text,
  full_name text,
  sport text,
  expires_at timestamptz,
  status public.athlete_invite_status,
  is_valid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := public.hash_invite_token(p_token);
begin
  return query
  select
    i.id,
    i.email,
    p.full_name,
    p.sport,
    i.expires_at,
    i.status,
    (
      i.status in ('draft', 'invited')
      and i.expires_at > now()
      and p.linked_user_id is null
    ) as is_valid
  from public.athlete_invites i
  join public.athlete_provisional_profiles p on p.id = i.provisional_profile_id
  where i.token_hash = v_hash
  limit 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: complete_athlete_invite_registration
-- ---------------------------------------------------------------------------

create or replace function public.complete_athlete_invite_registration(
  p_token text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := public.hash_invite_token(p_token);
  v_invite_id uuid;
  v_invite_status public.athlete_invite_status;
  v_invite_expires timestamptz;
  v_provisional_id uuid;
  v_prov record;
begin
  select i.id, i.status, i.expires_at, i.provisional_profile_id
  into v_invite_id, v_invite_status, v_invite_expires, v_provisional_id
  from public.athlete_invites i
  where i.token_hash = v_hash
  for update;

  if v_invite_id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite_status not in ('draft', 'invited') or v_invite_expires <= now() then
    raise exception 'INVITE_INVALID';
  end if;

  select * into v_prov
  from public.athlete_provisional_profiles
  where id = v_provisional_id
  for update;

  if v_prov.linked_user_id is not null then
    raise exception 'ALREADY_LINKED';
  end if;

  update public.profiles
  set
    name = v_prov.full_name,
    sport = v_prov.sport,
    team = v_prov.team,
    agency = v_prov.agency,
    region = v_prov.region,
    career_history = v_prov.career_history,
    achievements = v_prov.achievements,
    bio = v_prov.bio,
    goals = v_prov.goals,
    instagram_url = v_prov.instagram_url,
    tiktok_url = v_prov.tiktok_url,
    x_url = v_prov.x_url,
    youtube_url = v_prov.youtube_url,
    avatar_url = coalesce(v_prov.avatar_url, avatar_url),
    cover_url = coalesce(v_prov.cover_url, cover_url),
    is_profile_public = v_prov.is_public,
    athlete_review_status = v_prov.review_status,
    invited_via_provisional_id = v_prov.id,
    is_verified = (v_prov.review_status = 'approved'),
    account_type = 'athlete',
    updated_at = now()
  where id = p_user_id;

  update public.athlete_provisional_profiles
  set linked_user_id = p_user_id, updated_at = now()
  where id = v_prov.id;

  update public.athlete_invites
  set status = 'completed', completed_at = now(), updated_at = now()
  where id = v_invite_id;

  update public.athlete_organization_memberships
  set athlete_user_id = p_user_id, updated_at = now()
  where provisional_profile_id = v_prov.id
    and athlete_user_id is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin_send_athlete_invite
-- ---------------------------------------------------------------------------

create or replace function public.admin_send_athlete_invite(
  p_provisional_id uuid,
  p_new_token text default null,
  p_expires_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_invite record;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select * into v_invite
  from public.athlete_invites
  where provisional_profile_id = p_provisional_id
    and status in ('draft', 'invited', 'expired')
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  v_token := coalesce(nullif(trim(p_new_token), ''), encode(gen_random_bytes(24), 'hex'));

  update public.athlete_invites
  set
    token_hash = public.hash_invite_token(v_token),
    expires_at = coalesce(p_expires_at, now() + interval '14 days'),
    status = 'invited',
    sent_at = now(),
    resent_count = resent_count + case when sent_at is not null then 1 else 0 end,
    updated_at = now()
  where id = v_invite.id;

  return v_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin_cancel_athlete_invite
-- ---------------------------------------------------------------------------

create or replace function public.admin_cancel_athlete_invite(p_provisional_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  update public.athlete_invites
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where provisional_profile_id = p_provisional_id
    and status in ('draft', 'invited');
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin_update_organization_membership
-- ---------------------------------------------------------------------------

create or replace function public.admin_update_organization_membership(
  p_membership_id uuid,
  p_status public.membership_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  update public.athlete_organization_memberships
  set
    membership_status = p_status,
    left_at = case when p_status = 'left' then now() else left_at end,
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_membership_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin_upsert_organization
-- ---------------------------------------------------------------------------

create or replace function public.admin_upsert_organization(
  p_id uuid,
  p_name text,
  p_org_type public.organization_type,
  p_description text default '',
  p_region text default '',
  p_status public.organization_status default 'active',
  p_admin_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  if p_id is null then
    insert into public.organizations (
      name, org_type, description, region, status, admin_note, created_by
    ) values (
      trim(p_name), p_org_type,
      coalesce(p_description, ''),
      coalesce(p_region, ''),
      coalesce(p_status, 'active'),
      coalesce(p_admin_note, ''),
      auth.uid()
    )
    returning id into v_id;
  else
    update public.organizations
    set
      name = trim(p_name),
      org_type = p_org_type,
      description = coalesce(p_description, ''),
      region = coalesce(p_region, ''),
      status = coalesce(p_status, 'active'),
      admin_note = coalesce(p_admin_note, ''),
      updated_at = now()
    where id = p_id
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin_update_provisional_athlete
-- ---------------------------------------------------------------------------

create or replace function public.admin_update_provisional_athlete(
  p_id uuid,
  p_full_name text,
  p_sport text,
  p_team text default '',
  p_agency text default '',
  p_region text default '',
  p_career_history text default '',
  p_achievements text default '',
  p_bio text default '',
  p_goals text default '',
  p_is_public boolean default false,
  p_review_status public.athlete_review_status default 'approved',
  p_admin_note text default '',
  p_organization_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  update public.athlete_provisional_profiles
  set
    full_name = trim(p_full_name),
    sport = trim(p_sport),
    team = coalesce(p_team, ''),
    agency = coalesce(p_agency, ''),
    region = coalesce(p_region, ''),
    career_history = coalesce(p_career_history, ''),
    achievements = coalesce(p_achievements, ''),
    bio = coalesce(p_bio, ''),
    goals = coalesce(p_goals, ''),
    is_public = coalesce(p_is_public, false),
    review_status = coalesce(p_review_status, 'approved'),
    admin_note = coalesce(p_admin_note, ''),
    organization_id = p_organization_id,
    updated_at = now()
  where id = p_id
    and linked_user_id is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin_update_athlete_profile_proxy
-- ---------------------------------------------------------------------------

create or replace function public.admin_update_athlete_profile_proxy(
  p_user_id uuid,
  p_name text,
  p_sport text,
  p_team text default '',
  p_agency text default '',
  p_region text default '',
  p_career_history text default '',
  p_achievements text default '',
  p_bio text default '',
  p_goals text default '',
  p_instagram_url text default '',
  p_tiktok_url text default '',
  p_x_url text default '',
  p_youtube_url text default '',
  p_is_profile_public boolean default true,
  p_review_status public.athlete_review_status default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  update public.profiles
  set
    name = trim(p_name),
    sport = trim(p_sport),
    team = coalesce(p_team, ''),
    agency = coalesce(p_agency, ''),
    region = coalesce(p_region, ''),
    career_history = coalesce(p_career_history, ''),
    achievements = coalesce(p_achievements, ''),
    bio = coalesce(p_bio, ''),
    goals = coalesce(p_goals, ''),
    instagram_url = coalesce(p_instagram_url, ''),
    tiktok_url = coalesce(p_tiktok_url, ''),
    x_url = coalesce(p_x_url, ''),
    youtube_url = coalesce(p_youtube_url, ''),
    is_profile_public = coalesce(p_is_profile_public, true),
    athlete_review_status = coalesce(p_review_status, athlete_review_status),
    is_verified = coalesce(p_review_status, athlete_review_status) = 'approved',
    updated_at = now()
  where id = p_user_id
    and account_type = 'athlete';
end;
$$;

-- ---------------------------------------------------------------------------
-- Update search_athletes: approved + public + not suspended
-- ---------------------------------------------------------------------------

create or replace function public.search_athletes(
  p_query text default '',
  p_sport text default '',
  p_region text default '',
  p_gender text default '',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  sport text,
  team text,
  region text,
  avatar_url text,
  is_verified boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.sport,
    p.team,
    p.region,
    p.avatar_url,
    p.is_verified
  from public.profiles p
  where p.account_type = 'athlete'
    and p.athlete_review_status = 'approved'
    and p.is_profile_public = true
    and coalesce(p.is_suspended, false) = false
    and (
      p_query = '' or p_query is null
      or p.name ilike '%' || p_query || '%'
      or p.sport ilike '%' || p_query || '%'
      or p.team ilike '%' || p_query || '%'
    )
    and (p_sport = '' or p_sport is null or p.sport ilike '%' || p_sport || '%')
    and (p_region = '' or p_region is null or p.region ilike '%' || p_region || '%')
    and (p_gender = '' or p_gender is null or p.gender = p_gender)
  order by p.name
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant execute on function public.hash_invite_token(text) to authenticated;
grant execute on function public.admin_create_provisional_athlete(
  text, text, text, text, text, text, text, text, text, text, boolean,
  public.athlete_review_status, text, uuid, text, timestamptz
) to authenticated;
grant execute on function public.get_athlete_invite_public(text) to anon, authenticated;
grant execute on function public.complete_athlete_invite_registration(text, uuid) to authenticated;
grant execute on function public.admin_send_athlete_invite(uuid, text, timestamptz) to authenticated;
grant execute on function public.admin_cancel_athlete_invite(uuid) to authenticated;
grant execute on function public.admin_update_organization_membership(uuid, public.membership_status) to authenticated;
grant execute on function public.admin_upsert_organization(
  uuid, text, public.organization_type, text, text, public.organization_status, text
) to authenticated;
grant execute on function public.admin_update_provisional_athlete(
  uuid, text, text, text, text, text, text, text, text, text, boolean,
  public.athlete_review_status, text, uuid
) to authenticated;
grant execute on function public.admin_update_athlete_profile_proxy(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, boolean, public.athlete_review_status
) to authenticated;
