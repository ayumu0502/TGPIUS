-- Run this in the Supabase SQL Editor AFTER search-schema.sql

create or replace function public.get_athlete_rankings(
  p_category text default 'overall',
  p_period text default 'month',
  p_sport text default null,
  p_region text default null,
  p_limit integer default 50
)
returns table (
  rank bigint,
  id uuid,
  name text,
  sport text,
  team text,
  region text,
  avatar_url text,
  score bigint,
  gift_score bigint,
  follower_score bigint,
  like_score bigint
)
language sql
security definer
stable
set search_path = public
as $$
  with bounds as (
    select
      case
        when p_category = 'gifts_month' then now() - interval '30 days'
        when p_category = 'gifts_week' then now() - interval '7 days'
        when p_period = 'day' then now() - interval '1 day'
        when p_period = 'week' then now() - interval '7 days'
        when p_period = 'month' then now() - interval '30 days'
        else null::timestamptz
      end as start_at,
      case
        when p_category = 'trending' and p_period = 'day' then now() - interval '2 days'
        when p_category = 'trending' and p_period = 'week' then now() - interval '14 days'
        when p_category = 'trending' and p_period = 'month' then now() - interval '60 days'
        when p_category = 'trending' then now() - interval '60 days'
        else null::timestamptz
      end as prev_start_at,
      case
        when p_category = 'trending' and p_period = 'day' then now() - interval '1 day'
        when p_category = 'trending' and p_period = 'week' then now() - interval '7 days'
        when p_category = 'trending' and p_period = 'month' then now() - interval '30 days'
        when p_category = 'trending' then now() - interval '30 days'
        else null::timestamptz
      end as prev_end_at
  ),
  athlete_base as (
    select
      p.id,
      p.name,
      p.sport,
      p.team,
      p.region,
      p.avatar_url
    from public.profiles p
    where p.account_type = 'athlete'
      and coalesce(p.is_suspended, false) = false
      and (p_sport is null or trim(p_sport) = '' or p.sport ilike '%' || trim(p_sport) || '%')
      and (p_region is null or trim(p_region) = '' or p.region ilike '%' || trim(p_region) || '%')
  ),
  athlete_stats as (
    select
      a.id,
      a.name,
      a.sport,
      a.team,
      a.region,
      a.avatar_url,
      coalesce((
        select sum(g.amount)::bigint
        from public.gifts g
        cross join bounds b
        where g.receiver_id = a.id
          and (b.start_at is null or g.created_at >= b.start_at)
      ), 0) as gift_score,
      coalesce((
        select count(*)::bigint
        from public.follows f
        cross join bounds b
        where f.following_id = a.id
          and (b.start_at is null or f.created_at >= b.start_at)
      ), 0) as follower_score,
      coalesce((
        select count(*)::bigint
        from public.likes l
        join public.posts po on po.id = l.post_id
        cross join bounds b
        where po.user_id = a.id
          and (b.start_at is null or l.created_at >= b.start_at)
      ), 0) as like_score,
      coalesce((
        select sum(g.amount)::bigint
        from public.gifts g
        cross join bounds b
        where g.receiver_id = a.id
          and b.prev_start_at is not null
          and g.created_at >= b.prev_start_at
          and g.created_at < b.prev_end_at
      ), 0) as prev_gift_score,
      coalesce((
        select count(*)::bigint
        from public.follows f
        cross join bounds b
        where f.following_id = a.id
          and b.prev_start_at is not null
          and f.created_at >= b.prev_start_at
          and f.created_at < b.prev_end_at
      ), 0) as prev_follower_score,
      coalesce((
        select count(*)::bigint
        from public.likes l
        join public.posts po on po.id = l.post_id
        cross join bounds b
        where po.user_id = a.id
          and b.prev_start_at is not null
          and l.created_at >= b.prev_start_at
          and l.created_at < b.prev_end_at
      ), 0) as prev_like_score
    from athlete_base a
  ),
  scored as (
    select
      s.*,
      case
        when p_category in ('overall', 'gifts', 'gifts_month', 'gifts_week')
          then s.gift_score
        when p_category = 'followers' then s.follower_score
        when p_category = 'likes' then s.like_score
        when p_category = 'trending' then greatest(
          (s.gift_score + s.follower_score * 50 + s.like_score * 10)
          - (s.prev_gift_score + s.prev_follower_score * 50 + s.prev_like_score * 10),
          0
        )
        else s.gift_score
      end as raw_gift,
      case
        when p_category = 'overall'
          then s.gift_score + s.follower_score * 100 + s.like_score * 20
        when p_category in ('gifts', 'gifts_month', 'gifts_week') then s.gift_score
        when p_category = 'followers' then s.follower_score
        when p_category = 'likes' then s.like_score
        when p_category = 'trending' then greatest(
          (s.gift_score + s.follower_score * 50 + s.like_score * 10)
          - (s.prev_gift_score + s.prev_follower_score * 50 + s.prev_like_score * 10),
          0
        )
        else s.gift_score
      end as score
    from athlete_stats s
  )
  select
    row_number() over (order by sc.score desc, sc.name asc) as rank,
    sc.id,
    sc.name,
    sc.sport,
    sc.team,
    sc.region,
    sc.avatar_url,
    sc.score,
    sc.gift_score,
    sc.follower_score,
    sc.like_score
  from scored sc
  where sc.score > 0
  order by sc.score desc, sc.name asc
  limit greatest(p_limit, 1);
$$;

grant execute on function public.get_athlete_rankings(text, text, text, text, integer) to authenticated;
