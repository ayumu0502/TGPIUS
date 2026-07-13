-- Run this in the Supabase SQL Editor AFTER events-schema.sql

create type public.fanclub_benefit_type as enum (
  'exclusive_post',
  'exclusive_video',
  'exclusive_live',
  'exclusive_event',
  'exclusive_chat'
);

create type public.fanclub_membership_status as enum (
  'active',
  'cancelled',
  'expired'
);

create type public.fanclub_post_type as enum (
  'post',
  'video',
  'live',
  'event',
  'chat'
);

create table if not exists public.fanclub_plans (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.profiles(id) on delete cascade not null,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  price_yen integer not null check (price_yen in (500, 1000, 3000, 5000)),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, price_yen)
);

create table if not exists public.fanclub_benefits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.fanclub_plans(id) on delete cascade not null,
  benefit_type public.fanclub_benefit_type not null,
  title text not null default '',
  description text not null default '' check (char_length(description) <= 300),
  unique (plan_id, benefit_type)
);

create table if not exists public.fanclub_memberships (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.fanclub_plans(id) on delete cascade not null,
  athlete_id uuid references public.profiles(id) on delete cascade not null,
  fan_id uuid references public.profiles(id) on delete cascade not null,
  status public.fanclub_membership_status not null default 'active',
  price_yen integer not null check (price_yen in (500, 1000, 3000, 5000)),
  payment_method text not null default 'test' check (payment_method in ('test', 'stripe')),
  started_at timestamptz not null default now(),
  cancelled_at timestamptz,
  current_period_end timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create unique index if not exists fanclub_memberships_active_unique
  on public.fanclub_memberships (plan_id, fan_id)
  where status = 'active';

create table if not exists public.fanclub_posts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.fanclub_plans(id) on delete set null,
  post_type public.fanclub_post_type not null default 'post',
  title text not null check (char_length(title) between 1 and 120),
  content text not null default '' check (char_length(content) <= 3000),
  media_url text not null default '',
  is_members_only boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fanclub_payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid references public.fanclub_memberships(id) on delete set null,
  athlete_id uuid references public.profiles(id) on delete cascade not null,
  fan_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.fanclub_plans(id) on delete set null,
  amount_yen integer not null check (amount_yen > 0),
  payment_method text not null default 'test' check (payment_method in ('test', 'stripe')),
  created_at timestamptz not null default now()
);

create index if not exists fanclub_plans_athlete_id_idx on public.fanclub_plans (athlete_id);
create index if not exists fanclub_memberships_athlete_id_idx on public.fanclub_memberships (athlete_id);
create index if not exists fanclub_memberships_fan_id_idx on public.fanclub_memberships (fan_id);
create index if not exists fanclub_posts_athlete_id_idx on public.fanclub_posts (athlete_id);
create index if not exists fanclub_payments_athlete_id_idx on public.fanclub_payments (athlete_id);
create index if not exists fanclub_payments_created_at_idx on public.fanclub_payments (created_at desc);

alter table public.fanclub_plans enable row level security;
alter table public.fanclub_benefits enable row level security;
alter table public.fanclub_memberships enable row level security;
alter table public.fanclub_posts enable row level security;
alter table public.fanclub_payments enable row level security;

drop policy if exists "Authenticated can view active fanclub plans" on public.fanclub_plans;
create policy "Authenticated can view active fanclub plans"
  on public.fanclub_plans for select
  using (
    auth.role() = 'authenticated'
    and (is_active = true or athlete_id = auth.uid())
  );

drop policy if exists "Athletes manage own fanclub plans" on public.fanclub_plans;
create policy "Athletes manage own fanclub plans"
  on public.fanclub_plans for all
  using (athlete_id = auth.uid())
  with check (athlete_id = auth.uid());

drop policy if exists "Authenticated can view fanclub benefits" on public.fanclub_benefits;
create policy "Authenticated can view fanclub benefits"
  on public.fanclub_benefits for select
  using (auth.role() = 'authenticated');

drop policy if exists "View own memberships" on public.fanclub_memberships;
create policy "View own memberships"
  on public.fanclub_memberships for select
  using (fan_id = auth.uid() or athlete_id = auth.uid());

drop policy if exists "View fanclub posts via membership" on public.fanclub_posts;
create policy "View fanclub posts via membership"
  on public.fanclub_posts for select
  using (
    auth.role() = 'authenticated'
    and (
      athlete_id = auth.uid()
      or is_members_only = false
      or exists (
        select 1 from public.fanclub_memberships m
        where m.fan_id = auth.uid()
          and m.athlete_id = fanclub_posts.athlete_id
          and m.status = 'active'
          and m.current_period_end > now()
          and (fanclub_posts.plan_id is null or fanclub_posts.plan_id = m.plan_id)
      )
    )
  );

drop policy if exists "Athletes manage own fanclub posts" on public.fanclub_posts;
create policy "Athletes manage own fanclub posts"
  on public.fanclub_posts for all
  using (athlete_id = auth.uid())
  with check (athlete_id = auth.uid());

drop policy if exists "View own fanclub payments" on public.fanclub_payments;
create policy "View own fanclub payments"
  on public.fanclub_payments for select
  using (fan_id = auth.uid() or athlete_id = auth.uid());

create or replace function public.save_fanclub_plan(
  p_price_yen integer,
  p_title text,
  p_description text default '',
  p_benefit_types public.fanclub_benefit_type[] default '{}',
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_athlete_id uuid := auth.uid();
  v_account_type public.account_type;
  v_plan_id uuid;
  v_benefit public.fanclub_benefit_type;
  v_labels jsonb := jsonb_build_object(
    'exclusive_post', '限定投稿',
    'exclusive_video', '限定動画',
    'exclusive_live', '限定ライブ',
    'exclusive_event', '限定イベント',
    'exclusive_chat', '限定チャット'
  );
begin
  if v_athlete_id is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select account_type into v_account_type from public.profiles where id = v_athlete_id;
  if v_account_type <> 'athlete' then raise exception 'NOT_ATHLETE'; end if;
  if p_price_yen not in (500, 1000, 3000, 5000) then raise exception 'INVALID_PRICE'; end if;
  if trim(p_title) = '' then raise exception 'TITLE_REQUIRED'; end if;

  insert into public.fanclub_plans (athlete_id, title, description, price_yen, is_active)
  values (v_athlete_id, trim(p_title), coalesce(trim(p_description), ''), p_price_yen, p_is_active)
  on conflict (athlete_id, price_yen) do update set
    title = excluded.title,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_at = now()
  returning id into v_plan_id;

  delete from public.fanclub_benefits where plan_id = v_plan_id;

  foreach v_benefit in array coalesce(p_benefit_types, '{}')
  loop
    insert into public.fanclub_benefits (plan_id, benefit_type, title, description)
    values (
      v_plan_id,
      v_benefit,
      coalesce(v_labels ->> v_benefit::text, v_benefit::text),
      ''
    );
  end loop;

  return v_plan_id;
end;
$$;

create or replace function public.subscribe_fanclub_plan(p_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fan_id uuid := auth.uid();
  v_account_type public.account_type;
  v_balance integer;
  v_plan public.fanclub_plans%rowtype;
  v_membership_id uuid;
begin
  if v_fan_id is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select account_type, point_balance into v_account_type, v_balance
  from public.profiles where id = v_fan_id;

  if v_account_type <> 'fan' then raise exception 'NOT_FAN'; end if;

  select * into v_plan from public.fanclub_plans
  where id = p_plan_id and is_active = true;

  if v_plan.id is null then raise exception 'PLAN_NOT_FOUND'; end if;
  if v_plan.athlete_id = v_fan_id then raise exception 'SELF_SUBSCRIBE'; end if;

  if exists (
    select 1 from public.fanclub_memberships m
    where m.plan_id = p_plan_id and m.fan_id = v_fan_id and m.status = 'active'
      and m.current_period_end > now()
  ) then
    raise exception 'ALREADY_SUBSCRIBED';
  end if;

  if v_balance < v_plan.price_yen then raise exception 'INSUFFICIENT_BALANCE'; end if;

  perform set_config('app.allow_point_update', 'true', true);
  update public.profiles
  set point_balance = point_balance - v_plan.price_yen, updated_at = now()
  where id = v_fan_id;

  insert into public.fanclub_memberships (
    plan_id, athlete_id, fan_id, status, price_yen, payment_method, current_period_end
  )
  values (
    v_plan.id, v_plan.athlete_id, v_fan_id, 'active', v_plan.price_yen, 'test',
    now() + interval '30 days'
  )
  returning id into v_membership_id;

  insert into public.fanclub_payments (
    membership_id, athlete_id, fan_id, plan_id, amount_yen, payment_method
  )
  values (
    v_membership_id, v_plan.athlete_id, v_fan_id, v_plan.id, v_plan.price_yen, 'test'
  );

  return v_membership_id;
end;
$$;

create or replace function public.cancel_fanclub_membership(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.fanclub_memberships%rowtype;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_membership from public.fanclub_memberships
  where id = p_membership_id and fan_id = v_user_id and status = 'active';

  if v_membership.id is null then raise exception 'MEMBERSHIP_NOT_FOUND'; end if;

  update public.fanclub_memberships
  set status = 'cancelled', cancelled_at = now()
  where id = p_membership_id;
end;
$$;

create or replace function public.create_fanclub_post(
  p_title text,
  p_content text default '',
  p_post_type public.fanclub_post_type default 'post',
  p_plan_id uuid default null,
  p_media_url text default '',
  p_is_members_only boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_athlete_id uuid := auth.uid();
  v_post_id uuid;
begin
  if v_athlete_id is null then raise exception 'NOT_AUTHENTICATED'; end if;

  if not exists (
    select 1 from public.profiles where id = v_athlete_id and account_type = 'athlete'
  ) then
    raise exception 'NOT_ATHLETE';
  end if;

  insert into public.fanclub_posts (
    athlete_id, plan_id, post_type, title, content, media_url, is_members_only
  )
  values (
    v_athlete_id,
    p_plan_id,
    p_post_type,
    trim(p_title),
    coalesce(trim(p_content), ''),
    coalesce(trim(p_media_url), ''),
    p_is_members_only
  )
  returning id into v_post_id;

  return v_post_id;
end;
$$;

create or replace function public.list_fanclub_catalog(p_limit integer default 50)
returns table (
  athlete_id uuid,
  athlete_name text,
  athlete_sport text,
  athlete_avatar_url text,
  plan_count bigint,
  member_count bigint,
  min_price_yen integer
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id as athlete_id,
    p.name as athlete_name,
    p.sport as athlete_sport,
    p.avatar_url as athlete_avatar_url,
    count(distinct fp.id)::bigint as plan_count,
    count(distinct m.id) filter (
      where m.status = 'active' and m.current_period_end > now()
    )::bigint as member_count,
    min(fp.price_yen)::integer as min_price_yen
  from public.profiles p
  join public.fanclub_plans fp on fp.athlete_id = p.id and fp.is_active = true
  left join public.fanclub_memberships m on m.athlete_id = p.id
  where p.account_type = 'athlete'
    and coalesce(p.is_suspended, false) = false
  group by p.id, p.name, p.sport, p.avatar_url
  order by member_count desc, p.name asc
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_athlete_fanclub_page(p_athlete_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_viewer_id uuid := auth.uid();
  v_result jsonb;
begin
  select jsonb_build_object(
    'athlete', (
      select jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'sport', p.sport,
        'avatar_url', p.avatar_url
      )
      from public.profiles p
      where p.id = p_athlete_id and p.account_type = 'athlete'
    ),
    'plans', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', fp.id,
          'title', fp.title,
          'description', fp.description,
          'price_yen', fp.price_yen,
          'benefits', coalesce((
            select jsonb_agg(jsonb_build_object(
              'benefit_type', fb.benefit_type,
              'title', fb.title,
              'description', fb.description
            ) order by fb.benefit_type)
            from public.fanclub_benefits fb where fb.plan_id = fp.id
          ), '[]'::jsonb),
          'member_count', (
            select count(*)::int from public.fanclub_memberships m
            where m.plan_id = fp.id and m.status = 'active'
              and m.current_period_end > now()
          )
        ) order by fp.price_yen
      )
      from public.fanclub_plans fp
      where fp.athlete_id = p_athlete_id and fp.is_active = true
    ), '[]'::jsonb),
    'membership', (
      select jsonb_build_object(
        'id', m.id,
        'plan_id', m.plan_id,
        'status', m.status,
        'started_at', m.started_at,
        'current_period_end', m.current_period_end,
        'price_yen', m.price_yen
      )
      from public.fanclub_memberships m
      where m.fan_id = v_viewer_id
        and m.athlete_id = p_athlete_id
        and m.status = 'active'
        and m.current_period_end > now()
      order by m.started_at desc
      limit 1
    ),
    'posts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', po.id,
          'plan_id', po.plan_id,
          'post_type', po.post_type,
          'title', po.title,
          'content', po.content,
          'media_url', po.media_url,
          'is_members_only', po.is_members_only,
          'created_at', po.created_at
        ) order by po.created_at desc
      )
      from public.fanclub_posts po
      where po.athlete_id = p_athlete_id
        and (
          po.is_members_only = false
          or po.athlete_id = v_viewer_id
          or exists (
            select 1 from public.fanclub_memberships m
            where m.fan_id = v_viewer_id
              and m.athlete_id = po.athlete_id
              and m.status = 'active'
              and m.current_period_end > now()
              and (po.plan_id is null or po.plan_id = m.plan_id)
          )
        )
      limit 20
    ), '[]'::jsonb)
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

create or replace function public.get_athlete_fanclub_manage()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_athlete_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_athlete_id is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select jsonb_build_object(
    'plans', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', fp.id,
          'title', fp.title,
          'description', fp.description,
          'price_yen', fp.price_yen,
          'is_active', fp.is_active,
          'member_count', (
            select count(*)::int from public.fanclub_memberships m
            where m.plan_id = fp.id and m.status = 'active'
              and m.current_period_end > now()
          ),
          'benefits', coalesce((
            select jsonb_agg(fb.benefit_type order by fb.benefit_type)
            from public.fanclub_benefits fb where fb.plan_id = fp.id
          ), '[]'::jsonb)
        ) order by fp.price_yen
      )
      from public.fanclub_plans fp where fp.athlete_id = v_athlete_id
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'fan_id', m.fan_id,
          'fan_name', pr.name,
          'fan_avatar_url', pr.avatar_url,
          'plan_id', m.plan_id,
          'price_yen', m.price_yen,
          'status', m.status,
          'started_at', m.started_at,
          'current_period_end', m.current_period_end
        ) order by m.started_at desc
      )
      from public.fanclub_memberships m
      join public.profiles pr on pr.id = m.fan_id
      where m.athlete_id = v_athlete_id
        and m.status in ('active', 'cancelled')
      limit 100
    ), '[]'::jsonb),
    'stats', jsonb_build_object(
      'active_members', (
        select count(*)::int from public.fanclub_memberships m
        where m.athlete_id = v_athlete_id and m.status = 'active'
          and m.current_period_end > now()
      ),
      'monthly_revenue', coalesce((
        select sum(pay.amount_yen)::int from public.fanclub_payments pay
        where pay.athlete_id = v_athlete_id
          and pay.created_at >= date_trunc('month', now())
      ), 0),
      'churn_rate', case
        when (
          select count(*) from public.fanclub_memberships m
          where m.athlete_id = v_athlete_id
        ) = 0 then 0
        else round((
          select count(*)::numeric from public.fanclub_memberships m
          where m.athlete_id = v_athlete_id and m.status = 'cancelled'
        ) * 100.0 / nullif((
          select count(*) from public.fanclub_memberships m
          where m.athlete_id = v_athlete_id
        ), 0), 1)
      end,
      'member_growth', coalesce((
        select jsonb_agg(jsonb_build_object(
          'month', to_char(months.month, 'YYYY-MM'),
          'count', coalesce(counts.cnt, 0)
        ) order by months.month)
        from generate_series(
          date_trunc('month', now()) - interval '5 months',
          date_trunc('month', now()),
          interval '1 month'
        ) as months(month)
        left join lateral (
          select count(*)::int as cnt
          from public.fanclub_memberships m
          where m.athlete_id = v_athlete_id
            and m.status = 'active'
            and date_trunc('month', m.started_at) = months.month
        ) counts on true
      ), '[]'::jsonb)
    )
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

create or replace function public.list_fan_subscriptions()
returns table (
  id uuid,
  athlete_id uuid,
  athlete_name text,
  athlete_avatar_url text,
  athlete_sport text,
  plan_id uuid,
  plan_title text,
  price_yen integer,
  status public.fanclub_membership_status,
  started_at timestamptz,
  cancelled_at timestamptz,
  current_period_end timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    m.id,
    m.athlete_id,
    p.name as athlete_name,
    p.avatar_url as athlete_avatar_url,
    p.sport as athlete_sport,
    m.plan_id,
    fp.title as plan_title,
    m.price_yen,
    m.status,
    m.started_at,
    m.cancelled_at,
    m.current_period_end
  from public.fanclub_memberships m
  join public.profiles p on p.id = m.athlete_id
  join public.fanclub_plans fp on fp.id = m.plan_id
  where m.fan_id = auth.uid()
  order by m.started_at desc;
$$;

create or replace function public.get_admin_fanclub_analytics()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'total_subscriptions', (
      select count(*)::int from public.fanclub_memberships
    ),
    'active_subscriptions', (
      select count(*)::int from public.fanclub_memberships m
      where m.status = 'active' and m.current_period_end > now()
    ),
    'total_revenue', coalesce((
      select sum(amount_yen)::int from public.fanclub_payments
    ), 0),
    'monthly_revenue', coalesce((
      select sum(amount_yen)::int from public.fanclub_payments
      where created_at >= date_trunc('month', now())
    ), 0),
    'join_rate', case
      when (select count(*) from public.profiles where account_type = 'fan') = 0 then 0
      else round((
        select count(distinct fan_id)::numeric from public.fanclub_memberships
      ) * 100.0 / (
        select count(*) from public.profiles where account_type = 'fan'
      ), 1)
    end,
    'churn_rate', case
      when (select count(*) from public.fanclub_memberships) = 0 then 0
      else round((
        select count(*)::numeric from public.fanclub_memberships
        where status = 'cancelled'
      ) * 100.0 / (
        select count(*) from public.fanclub_memberships
      ), 1)
    end,
    'top_athletes', coalesce((
      select jsonb_agg(row_to_json(t) order by t.member_count desc)
      from (
        select
          p.name as athlete_name,
          count(m.id) filter (
            where m.status = 'active' and m.current_period_end > now()
          )::int as member_count,
          coalesce(sum(pay.amount_yen), 0)::int as revenue
        from public.profiles p
        left join public.fanclub_memberships m on m.athlete_id = p.id
        left join public.fanclub_payments pay on pay.athlete_id = p.id
        where p.account_type = 'athlete'
        group by p.id, p.name
        order by member_count desc
        limit 10
      ) t
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.save_fanclub_plan(integer, text, text, public.fanclub_benefit_type[], boolean) to authenticated;
grant execute on function public.subscribe_fanclub_plan(uuid) to authenticated;
grant execute on function public.cancel_fanclub_membership(uuid) to authenticated;
grant execute on function public.create_fanclub_post(text, text, public.fanclub_post_type, uuid, text, boolean) to authenticated;
grant execute on function public.list_fanclub_catalog(integer) to authenticated;
grant execute on function public.get_athlete_fanclub_page(uuid) to authenticated;
grant execute on function public.get_athlete_fanclub_manage() to authenticated;
grant execute on function public.list_fan_subscriptions() to authenticated;
grant execute on function public.get_admin_fanclub_analytics() to authenticated;
