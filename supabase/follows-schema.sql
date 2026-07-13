-- Run this in the Supabase SQL Editor AFTER search-schema.sql
-- (follows table + notify_on_follow trigger must already exist)

create or replace function public.get_follow_stats(
  p_user_id uuid,
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
  v_following_count bigint := 0;
  v_is_following boolean := false;
  v_is_followed_by boolean := false;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and coalesce(p.is_suspended, false) = false
  ) then
    return null;
  end if;

  select count(*)::bigint
  into v_follower_count
  from public.follows f
  where f.following_id = p_user_id;

  select count(*)::bigint
  into v_following_count
  from public.follows f
  where f.follower_id = p_user_id;

  if p_viewer_id is not null then
    select exists (
      select 1 from public.follows f
      where f.follower_id = p_viewer_id
        and f.following_id = p_user_id
    )
    into v_is_following;

    select exists (
      select 1 from public.follows f
      where f.follower_id = p_user_id
        and f.following_id = p_viewer_id
    )
    into v_is_followed_by;
  end if;

  return jsonb_build_object(
    'follower_count', v_follower_count,
    'following_count', v_following_count,
    'is_following', v_is_following,
    'is_followed_by', v_is_followed_by,
    'is_mutual', v_is_following and v_is_followed_by
  );
end;
$$;

create or replace function public.list_followers(
  p_user_id uuid,
  p_viewer_id uuid default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  sport text,
  team text,
  region text,
  avatar_url text,
  account_type public.account_type,
  followed_at timestamptz,
  is_following boolean,
  is_followed_by boolean,
  is_mutual boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.sport,
    p.team,
    p.region,
    p.avatar_url,
    p.account_type,
    f.created_at as followed_at,
    coalesce((
      select true from public.follows vf
      where vf.follower_id = coalesce(p_viewer_id, auth.uid())
        and vf.following_id = p.id
    ), false) as is_following,
    coalesce((
      select true from public.follows vf
      where vf.follower_id = p.id
        and vf.following_id = coalesce(p_viewer_id, auth.uid())
    ), false) as is_followed_by,
    exists (
      select 1 from public.follows mf
      where mf.follower_id = p_user_id
        and mf.following_id = p.id
    ) as is_mutual
  from public.follows f
  join public.profiles p on p.id = f.follower_id
  where f.following_id = p_user_id
    and coalesce(p.is_suspended, false) = false
  order by f.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

create or replace function public.list_following(
  p_user_id uuid,
  p_viewer_id uuid default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  sport text,
  team text,
  region text,
  avatar_url text,
  account_type public.account_type,
  followed_at timestamptz,
  is_following boolean,
  is_followed_by boolean,
  is_mutual boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.sport,
    p.team,
    p.region,
    p.avatar_url,
    p.account_type,
    f.created_at as followed_at,
    coalesce((
      select true from public.follows vf
      where vf.follower_id = coalesce(p_viewer_id, auth.uid())
        and vf.following_id = p.id
    ), false) as is_following,
    coalesce((
      select true from public.follows vf
      where vf.follower_id = p.id
        and vf.following_id = coalesce(p_viewer_id, auth.uid())
    ), false) as is_followed_by,
    exists (
      select 1 from public.follows mf
      where mf.follower_id = p.id
        and mf.following_id = p_user_id
    ) as is_mutual
  from public.follows f
  join public.profiles p on p.id = f.following_id
  where f.follower_id = p_user_id
    and coalesce(p.is_suspended, false) = false
  order by f.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

create or replace function public.get_recommended_athletes(
  p_limit integer default 12
)
returns table (
  id uuid,
  name text,
  sport text,
  team text,
  region text,
  avatar_url text,
  account_type public.account_type,
  follower_count bigint,
  gift_total bigint,
  is_following boolean
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
      p.avatar_url,
      p.account_type,
      coalesce((
        select count(*)::bigint from public.follows f where f.following_id = p.id
      ), 0) as follower_count,
      coalesce((
        select sum(g.amount)::bigint from public.gifts g where g.receiver_id = p.id
      ), 0) as gift_total
    from public.profiles p
    where p.account_type = 'athlete'
      and coalesce(p.is_suspended, false) = false
      and p.id <> auth.uid()
      and not exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid()
          and f.following_id = p.id
      )
  )
  select
    a.id,
    a.name,
    a.sport,
    a.team,
    a.region,
    a.avatar_url,
    a.account_type,
    a.follower_count,
    a.gift_total,
    false as is_following
  from athlete_stats a
  order by (a.follower_count * 10 + a.gift_total) desc, a.name asc
  limit greatest(p_limit, 1);
$$;

create or replace function public.list_my_following_ids()
returns table (following_id uuid)
language sql
security definer
stable
set search_path = public
as $$
  select f.following_id
  from public.follows f
  where f.follower_id = auth.uid();
$$;

grant execute on function public.get_follow_stats(uuid, uuid) to authenticated;
grant execute on function public.list_followers(uuid, uuid, integer, integer) to authenticated;
grant execute on function public.list_following(uuid, uuid, integer, integer) to authenticated;
grant execute on function public.get_recommended_athletes(integer) to authenticated;
grant execute on function public.list_my_following_ids() to authenticated;

-- Requires search-schema.sql (follows table + notify_on_follow trigger)
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

grant execute on function public.toggle_follow(uuid) to authenticated;
