-- Run this in the Supabase SQL Editor AFTER profile-fields-schema.sql and search-schema.sql

alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists youtube_url text default '';
alter table public.profiles add column if not exists is_verified boolean not null default false;

create or replace function public.get_athlete_profile_stats(
  p_athlete_id uuid,
  p_viewer_id uuid default null
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_follower_count bigint := 0;
  v_gift_total bigint := 0;
  v_monthly_gift_total bigint := 0;
  v_is_following boolean := false;
  v_rank bigint := null;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = p_athlete_id
      and p.account_type = 'athlete'
      and coalesce(p.is_suspended, false) = false
  ) then
    return null;
  end if;

  select count(*)::bigint
  into v_follower_count
  from public.follows f
  where f.following_id = p_athlete_id;

  select coalesce(sum(g.amount), 0)::bigint
  into v_gift_total
  from public.gifts g
  where g.receiver_id = p_athlete_id;

  select coalesce(sum(g.amount), 0)::bigint
  into v_monthly_gift_total
  from public.gifts g
  where g.receiver_id = p_athlete_id
    and g.created_at >= now() - interval '30 days';

  if p_viewer_id is not null then
    select exists (
      select 1 from public.follows f
      where f.follower_id = p_viewer_id
        and f.following_id = p_athlete_id
    )
    into v_is_following;
  end if;

  select r.rank
  into v_rank
  from public.get_athlete_rankings('gifts_month', 'month', null, null, 500) r
  where r.id = p_athlete_id
  limit 1;

  return jsonb_build_object(
    'follower_count', v_follower_count,
    'gift_total', v_gift_total,
    'monthly_gift_total', v_monthly_gift_total,
    'is_following', v_is_following,
    'rank', v_rank
  );
end;
$$;

create or replace function public.get_athlete_recent_gifts(
  p_athlete_id uuid,
  p_limit integer default 5
)
returns table (
  id uuid,
  amount integer,
  message text,
  created_at timestamptz,
  sender_name text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    g.id,
    g.amount,
    g.message,
    g.created_at,
    coalesce(nullif(trim(p.name), ''), '匿名ファン') as sender_name
  from public.gifts g
  join public.profiles p on p.id = g.sender_id
  where g.receiver_id = p_athlete_id
  order by g.created_at desc
  limit greatest(p_limit, 1);
$$;

create or replace function public.toggle_follow(p_following_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_follower_id uuid := auth.uid();
  v_following_type public.account_type;
begin
  if v_follower_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if v_follower_id = p_following_id then
    raise exception 'SELF_FOLLOW';
  end if;

  select account_type
  into v_following_type
  from public.profiles
  where id = p_following_id;

  if v_following_type is null then
    raise exception 'USER_NOT_FOUND';
  end if;

  if exists (
    select 1 from public.follows f
    where f.follower_id = v_follower_id
      and f.following_id = p_following_id
  ) then
    delete from public.follows
    where follower_id = v_follower_id
      and following_id = p_following_id;
    return false;
  end if;

  insert into public.follows (follower_id, following_id)
  values (v_follower_id, p_following_id);

  return true;
end;
$$;

grant execute on function public.get_athlete_profile_stats(uuid, uuid) to authenticated;
grant execute on function public.get_athlete_recent_gifts(uuid, integer) to authenticated;
grant execute on function public.toggle_follow(uuid) to authenticated;
