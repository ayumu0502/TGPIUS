-- TGPLUS Production v1 migration
-- Run in Supabase SQL Editor AFTER all existing schemas (schema.sql through admin-schema.sql)

-- ── Point purchase amounts (1 pt = ¥1 internally) ──
alter table public.payments drop constraint if exists payments_point_amount_check;
alter table public.payments add constraint payments_point_amount_check
  check (point_amount in (1000, 3000, 5000, 10000, 30000, 50000, 100000));

alter table public.point_transactions drop constraint if exists point_transactions_amount_check;
alter table public.point_transactions add constraint point_transactions_amount_check
  check (amount in (1000, 3000, 5000, 10000, 30000, 50000, 100000));

-- ── Gift amounts ──
alter table public.gifts drop constraint if exists gifts_amount_check;
alter table public.gifts add constraint gifts_amount_check
  check (amount in (100, 300, 500, 1000, 3000, 10000));

-- ── Athlete earnings & supporter flag ──
alter table public.profiles
  add column if not exists earnings_balance integer not null default 0 check (earnings_balance >= 0);

alter table public.profiles
  add column if not exists is_supporter boolean not null default false;

-- ── Stripe webhook idempotency ──
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

-- ── Platform subscription (TGPLUS Supporter) ──
create table if not exists public.platform_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'past_due', 'cancelled', 'trialing')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_subscriptions_status_idx
  on public.platform_subscriptions (status);

alter table public.platform_subscriptions enable row level security;

drop policy if exists "Users can view own platform subscription" on public.platform_subscriptions;
create policy "Users can view own platform subscription"
  on public.platform_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all platform subscriptions" on public.platform_subscriptions;
create policy "Admins can view all platform subscriptions"
  on public.platform_subscriptions for select
  using (public.is_admin());

-- ── Stripe Connect accounts ──
create table if not exists public.stripe_connect_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_connect_accounts enable row level security;

drop policy if exists "Athletes can view own connect account" on public.stripe_connect_accounts;
create policy "Athletes can view own connect account"
  on public.stripe_connect_accounts for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all connect accounts" on public.stripe_connect_accounts;
create policy "Admins can view all connect accounts"
  on public.stripe_connect_accounts for select
  using (public.is_admin());

-- ── Payout requests ──
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount >= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'processing', 'completed', 'rejected')),
  stripe_transfer_id text,
  admin_note text,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists payout_requests_user_id_idx on public.payout_requests (user_id);
create index if not exists payout_requests_status_idx on public.payout_requests (status);

alter table public.payout_requests enable row level security;

drop policy if exists "Athletes can view own payout requests" on public.payout_requests;
create policy "Athletes can view own payout requests"
  on public.payout_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all payout requests" on public.payout_requests;
create policy "Admins can view all payout requests"
  on public.payout_requests for select
  using (public.is_admin());

-- ── Updated purchase_points (test) ──
create or replace function public.purchase_points(p_amount integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_type public.account_type;
  v_transaction_id uuid;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_amount not in (1000, 3000, 5000, 10000, 30000, 50000, 100000) then
    raise exception 'INVALID_AMOUNT';
  end if;

  select account_type into v_user_type from public.profiles where id = v_user_id;
  if v_user_type is null or v_user_type <> 'fan' then raise exception 'NOT_FAN'; end if;

  perform set_config('app.allow_point_update', 'true', true);
  update public.profiles set point_balance = point_balance + p_amount, updated_at = now() where id = v_user_id;

  insert into public.point_transactions (user_id, amount, transaction_type, payment_method)
  values (v_user_id, p_amount, 'purchase', 'test')
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

-- ── Updated send_gift with athlete earnings ──
create or replace function public.send_gift(
  p_receiver_id uuid,
  p_amount integer,
  p_message text default ''
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
  v_balance integer;
  v_gift_id uuid;
  v_message text := coalesce(trim(p_message), '');
  v_platform_fee integer;
  v_net integer;
begin
  if v_sender_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_amount not in (100, 300, 500, 1000, 3000, 10000) then raise exception 'INVALID_AMOUNT'; end if;
  if char_length(v_message) > 200 then raise exception 'MESSAGE_TOO_LONG'; end if;
  if v_sender_id = p_receiver_id then raise exception 'SELF_GIFT'; end if;

  select account_type, point_balance into v_sender_type, v_balance
  from public.profiles where id = v_sender_id;

  if v_sender_type is null or v_sender_type <> 'fan' then raise exception 'SENDER_NOT_FAN'; end if;

  select account_type into v_receiver_type from public.profiles where id = p_receiver_id;
  if v_receiver_type is null or v_receiver_type <> 'athlete' then raise exception 'RECEIVER_NOT_ATHLETE'; end if;
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

  return v_gift_id;
end;
$$;

-- ── Payout request RPC ──
create or replace function public.request_payout(p_amount integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_type public.account_type;
  v_balance integer;
  v_request_id uuid;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_amount < 1000 then raise exception 'MINIMUM_PAYOUT'; end if;

  select account_type, earnings_balance into v_user_type, v_balance
  from public.profiles where id = v_user_id;

  if v_user_type is null or v_user_type <> 'athlete' then raise exception 'NOT_ATHLETE'; end if;
  if v_balance < p_amount then raise exception 'INSUFFICIENT_EARNINGS'; end if;

  perform set_config('app.allow_point_update', 'true', true);
  update public.profiles
  set earnings_balance = earnings_balance - p_amount, updated_at = now()
  where id = v_user_id;

  insert into public.payout_requests (user_id, amount, status)
  values (v_user_id, p_amount, 'pending')
  returning id into v_request_id;

  return v_request_id;
end;
$$;

grant execute on function public.request_payout(integer) to authenticated;
