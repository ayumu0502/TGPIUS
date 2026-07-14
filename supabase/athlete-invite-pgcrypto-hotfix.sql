-- Hotfix: pgcrypto functions on Supabase (extensions schema)
-- Run in SQL Editor if athlete invite RPCs fail with digest/gen_random_bytes errors

create extension if not exists pgcrypto with schema extensions;

create or replace function public.hash_invite_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

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

  v_token := coalesce(nullif(trim(p_token), ''), encode(extensions.gen_random_bytes(24), 'hex'));
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

  v_token := coalesce(nullif(trim(p_new_token), ''), encode(extensions.gen_random_bytes(24), 'hex'));

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

grant execute on function public.hash_invite_token(text) to anon, authenticated, service_role;
