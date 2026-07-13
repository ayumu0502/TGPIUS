-- Run this in the Supabase SQL Editor AFTER rankings-schema.sql

create type public.event_location_type as enum ('offline', 'online', 'hybrid');
create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.event_participant_status as enum ('registered', 'cancelled', 'checked_in');

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_type public.event_location_type not null default 'offline',
  venue_name text not null default '',
  venue_address text not null default '',
  online_url text not null default '',
  capacity integer not null check (capacity > 0 and capacity <= 10000),
  fee_points integer not null default 0 check (fee_points >= 0),
  status public.event_status not null default 'published',
  checkin_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_creator_id_idx on public.events (creator_id);
create index if not exists events_starts_at_idx on public.events (starts_at asc);
create index if not exists events_status_idx on public.events (status);

create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status public.event_participant_status not null default 'registered',
  paid_points integer not null default 0 check (paid_points >= 0),
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (event_id, user_id)
);

create index if not exists event_participants_event_id_idx on public.event_participants (event_id);
create index if not exists event_participants_user_id_idx on public.event_participants (user_id);
create index if not exists event_participants_status_idx on public.event_participants (status);

create table if not exists public.event_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  participant_id uuid references public.event_participants(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references public.profiles(id) on delete set null,
  method text not null default 'qr' check (method in ('qr', 'manual')),
  unique (event_id, user_id)
);

create index if not exists event_checkins_event_id_idx on public.event_checkins (event_id);

alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_checkins enable row level security;

drop policy if exists "Authenticated can view published events" on public.events;
create policy "Authenticated can view published events"
  on public.events for select
  using (
    auth.role() = 'authenticated'
    and (
      status = 'published'
      or creator_id = auth.uid()
    )
  );

drop policy if exists "Creators can insert events" on public.events;
create policy "Creators can insert events"
  on public.events for insert
  with check (auth.uid() = creator_id);

drop policy if exists "Creators can update own events" on public.events;
create policy "Creators can update own events"
  on public.events for update
  using (auth.uid() = creator_id);

drop policy if exists "View participants for accessible events" on public.event_participants;
create policy "View participants for accessible events"
  on public.event_participants for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and e.creator_id = auth.uid()
    )
  );

drop policy if exists "View checkins for accessible events" on public.event_checkins;
create policy "View checkins for accessible events"
  on public.event_checkins for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and e.creator_id = auth.uid()
    )
  );

create or replace function public.create_event(
  p_title text,
  p_starts_at timestamptz,
  p_description text default '',
  p_ends_at timestamptz default null,
  p_location_type public.event_location_type default 'offline',
  p_venue_name text default '',
  p_venue_address text default '',
  p_online_url text default '',
  p_capacity integer default 50,
  p_fee_points integer default 0,
  p_status public.event_status default 'published'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_account_type public.account_type;
  v_event_id uuid;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select account_type into v_account_type
  from public.profiles
  where id = v_user_id;

  if v_account_type is null or v_account_type <> 'athlete' then
    raise exception 'CREATOR_NOT_ATHLETE';
  end if;

  if trim(p_title) = '' then
    raise exception 'TITLE_REQUIRED';
  end if;

  if p_capacity < 1 then
    raise exception 'INVALID_CAPACITY';
  end if;

  if p_fee_points < 0 then
    raise exception 'INVALID_FEE';
  end if;

  insert into public.events (
    creator_id,
    title,
    description,
    starts_at,
    ends_at,
    location_type,
    venue_name,
    venue_address,
    online_url,
    capacity,
    fee_points,
    status
  )
  values (
    v_user_id,
    trim(p_title),
    coalesce(trim(p_description), ''),
    p_starts_at,
    p_ends_at,
    p_location_type,
    coalesce(trim(p_venue_name), ''),
    coalesce(trim(p_venue_address), ''),
    coalesce(trim(p_online_url), ''),
    p_capacity,
    p_fee_points,
    p_status
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function public.join_event(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.events%rowtype;
  v_participant_id uuid;
  v_registered_count integer;
  v_balance integer;
  v_account_type public.account_type;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if v_event.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if v_event.status <> 'published' then
    raise exception 'EVENT_NOT_OPEN';
  end if;

  if v_event.starts_at <= now() then
    raise exception 'EVENT_ALREADY_STARTED';
  end if;

  if v_event.creator_id = v_user_id then
    raise exception 'CREATOR_CANNOT_JOIN';
  end if;

  if exists (
    select 1 from public.event_participants ep
    where ep.event_id = p_event_id
      and ep.user_id = v_user_id
      and ep.status = 'registered'
  ) then
    raise exception 'ALREADY_JOINED';
  end if;

  select count(*)::integer into v_registered_count
  from public.event_participants ep
  where ep.event_id = p_event_id
    and ep.status = 'registered';

  if v_registered_count >= v_event.capacity then
    raise exception 'EVENT_FULL';
  end if;

  if v_event.fee_points > 0 then
    select account_type, point_balance
    into v_account_type, v_balance
    from public.profiles
    where id = v_user_id;

    if v_account_type is null or v_account_type <> 'fan' then
      raise exception 'PAID_EVENT_FAN_ONLY';
    end if;

    if v_balance < v_event.fee_points then
      raise exception 'INSUFFICIENT_BALANCE';
    end if;

    perform set_config('app.allow_point_update', 'true', true);

    update public.profiles
    set point_balance = point_balance - v_event.fee_points,
        updated_at = now()
    where id = v_user_id;
  end if;

  insert into public.event_participants (
    event_id,
    user_id,
    status,
    paid_points,
    registered_at,
    cancelled_at
  )
  values (
    p_event_id,
    v_user_id,
    'registered',
    v_event.fee_points,
    now(),
    null
  )
  on conflict (event_id, user_id) do update set
    status = 'registered',
    paid_points = excluded.paid_points,
    registered_at = now(),
    cancelled_at = null
  returning id into v_participant_id;

  return v_participant_id;
end;
$$;

create or replace function public.cancel_event_participation(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.events%rowtype;
  v_participant public.event_participants%rowtype;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_event
  from public.events
  where id = p_event_id;

  if v_event.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if v_event.starts_at <= now() then
    raise exception 'EVENT_ALREADY_STARTED';
  end if;

  select * into v_participant
  from public.event_participants
  where event_id = p_event_id
    and user_id = v_user_id
    and status = 'registered'
  for update;

  if v_participant.id is null then
    raise exception 'NOT_REGISTERED';
  end if;

  update public.event_participants
  set status = 'cancelled',
      cancelled_at = now()
  where id = v_participant.id;

  if v_participant.paid_points > 0 then
    perform set_config('app.allow_point_update', 'true', true);

    update public.profiles
    set point_balance = point_balance + v_participant.paid_points,
        updated_at = now()
    where id = v_user_id;
  end if;
end;
$$;

create or replace function public.checkin_event(
  p_event_id uuid,
  p_user_id uuid,
  p_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid := auth.uid();
  v_event public.events%rowtype;
  v_participant public.event_participants%rowtype;
  v_checkin_id uuid;
begin
  if v_staff_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_event
  from public.events
  where id = p_event_id;

  if v_event.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if v_event.creator_id <> v_staff_id then
    raise exception 'NOT_EVENT_CREATOR';
  end if;

  if v_event.checkin_code <> trim(p_code) then
    raise exception 'INVALID_CHECKIN_CODE';
  end if;

  select * into v_participant
  from public.event_participants
  where event_id = p_event_id
    and user_id = p_user_id
    and status in ('registered', 'checked_in')
  for update;

  if v_participant.id is null then
    raise exception 'PARTICIPANT_NOT_FOUND';
  end if;

  if v_participant.status = 'checked_in' then
    raise exception 'ALREADY_CHECKED_IN';
  end if;

  update public.event_participants
  set status = 'checked_in'
  where id = v_participant.id;

  insert into public.event_checkins (
    event_id,
    participant_id,
    user_id,
    checked_in_by,
    method
  )
  values (
    p_event_id,
    v_participant.id,
    p_user_id,
    v_staff_id,
    'qr'
  )
  returning id into v_checkin_id;

  return v_checkin_id;
end;
$$;

create or replace function public.list_events(
  p_scope text default 'upcoming',
  p_creator_id uuid default null,
  p_user_id uuid default null,
  p_limit integer default 50
)
returns table (
  id uuid,
  creator_id uuid,
  creator_name text,
  creator_avatar_url text,
  creator_sport text,
  title text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  location_type public.event_location_type,
  venue_name text,
  venue_address text,
  online_url text,
  capacity integer,
  fee_points integer,
  status public.event_status,
  checkin_code text,
  participant_count bigint,
  is_joined boolean,
  is_creator boolean,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    e.id,
    e.creator_id,
    p.name as creator_name,
    p.avatar_url as creator_avatar_url,
    p.sport as creator_sport,
    e.title,
    e.description,
    e.starts_at,
    e.ends_at,
    e.location_type,
    e.venue_name,
    e.venue_address,
    e.online_url,
    e.capacity,
    e.fee_points,
    e.status,
    case when e.creator_id = coalesce(p_user_id, auth.uid()) then e.checkin_code else null end as checkin_code,
    coalesce((
      select count(*)::bigint
      from public.event_participants ep
      where ep.event_id = e.id
        and ep.status in ('registered', 'checked_in')
    ), 0) as participant_count,
    exists (
      select 1 from public.event_participants ep
      where ep.event_id = e.id
        and ep.user_id = coalesce(p_user_id, auth.uid())
        and ep.status in ('registered', 'checked_in')
    ) as is_joined,
    e.creator_id = coalesce(p_user_id, auth.uid()) as is_creator,
    e.created_at
  from public.events e
  join public.profiles p on p.id = e.creator_id
  where coalesce(p.is_suspended, false) = false
    and (
      e.status = 'published'
      or e.creator_id = coalesce(p_user_id, auth.uid())
    )
    and (
      p_scope = 'all'
      or (p_scope = 'upcoming' and e.starts_at >= now() - interval '1 hour')
      or (p_scope = 'past' and e.starts_at < now())
      or (p_scope = 'mine' and e.creator_id = coalesce(p_creator_id, auth.uid()))
      or (p_scope = 'joined' and exists (
        select 1 from public.event_participants ep
        where ep.event_id = e.id
          and ep.user_id = coalesce(p_user_id, auth.uid())
          and ep.status in ('registered', 'checked_in')
      ))
    )
  order by
    case when p_scope = 'past' then e.starts_at end desc nulls last,
    e.starts_at asc
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_event_participants(p_event_id uuid)
returns table (
  id uuid,
  user_id uuid,
  user_name text,
  user_avatar_url text,
  status public.event_participant_status,
  registered_at timestamptz,
  checked_in_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    ep.id,
    ep.user_id,
    pr.name as user_name,
    pr.avatar_url as user_avatar_url,
    ep.status,
    ep.registered_at,
    ec.checked_in_at
  from public.event_participants ep
  join public.profiles pr on pr.id = ep.user_id
  left join public.event_checkins ec
    on ec.participant_id = ep.id
  where ep.event_id = p_event_id
    and ep.status in ('registered', 'checked_in')
    and (
      ep.user_id = auth.uid()
      or exists (
        select 1 from public.events e
        where e.id = p_event_id
          and e.creator_id = auth.uid()
      )
    )
  order by ep.registered_at asc;
$$;

grant execute on function public.create_event(text, timestamptz, text, timestamptz, public.event_location_type, text, text, text, integer, integer, public.event_status) to authenticated;
grant execute on function public.join_event(uuid) to authenticated;
grant execute on function public.cancel_event_participation(uuid) to authenticated;
grant execute on function public.checkin_event(uuid, uuid, text) to authenticated;
grant execute on function public.list_events(text, uuid, uuid, integer) to authenticated;
grant execute on function public.get_event_participants(uuid) to authenticated;
