-- Run this in the Supabase SQL Editor AFTER notifications-schema.sql

alter table public.profiles
  add column if not exists gender text not null default ''
  check (gender in ('', 'male', 'female', 'other'));

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists follows_follower_id_idx on public.follows (follower_id);

alter table public.follows enable row level security;

drop policy if exists "Authenticated can view follows" on public.follows;
create policy "Authenticated can view follows"
  on public.follows for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can follow" on public.follows;
create policy "Users can follow"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_follow(new.follower_id, new.following_id);
  return new;
end;
$$;

drop trigger if exists notify_on_follow_trigger on public.follows;
create trigger notify_on_follow_trigger
  after insert on public.follows
  for each row execute function public.notify_on_follow();

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
    case when p_sort = 'relevance' then a.gift_total end desc nulls last,
    a.name asc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

create or replace function public.search_users(
  p_query text,
  p_limit integer default 8
)
returns table (
  id uuid,
  name text,
  sport text,
  region text,
  avatar_url text,
  account_type public.account_type
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
    p.region,
    p.avatar_url,
    p.account_type
  from public.profiles p
  where coalesce(p.is_suspended, false) = false
    and trim(p_query) <> ''
    and (
      p.name ilike '%' || trim(p_query) || '%'
      or p.email ilike '%' || trim(p_query) || '%'
    )
  order by
    case when p.name ilike trim(p_query) || '%' then 0 else 1 end,
    p.name asc
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_discovery_athletes(
  p_section text default 'popular',
  p_limit integer default 8
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
      and coalesce(p.is_suspended, false) = false
  )
  select *
  from athlete_stats a
  order by
    case when p_section = 'popular' then a.gift_total end desc nulls last,
    case when p_section = 'new' then extract(epoch from a.created_at) end desc nulls last,
    case
      when p_section = 'recommended'
      then (a.gift_total + a.follower_count * 10 + a.post_count * 5)
    end desc nulls last,
    case when p_section = 'trending' then a.recent_gift_total end desc nulls last,
    a.name asc
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_search_filter_options()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'sports',
    coalesce(
      (
        select jsonb_agg(distinct sport order by sport)
        from public.profiles
        where account_type = 'athlete'
          and trim(sport) <> ''
      ),
      '[]'::jsonb
    ),
    'regions',
    coalesce(
      (
        select jsonb_agg(distinct region order by region)
        from public.profiles
        where account_type = 'athlete'
          and trim(region) <> ''
      ),
      '[]'::jsonb
    )
  );
$$;

grant execute on function public.search_athletes(text, text, text, text, integer, text, integer, integer) to authenticated;
grant execute on function public.search_users(text, integer) to authenticated;
grant execute on function public.get_discovery_athletes(text, integer) to authenticated;
grant execute on function public.get_search_filter_options() to authenticated;
