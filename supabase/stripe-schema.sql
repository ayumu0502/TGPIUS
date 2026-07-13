-- Run this in the Supabase SQL Editor AFTER points-schema.sql

create table if not exists public.stripe_customers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  point_amount integer not null check (point_amount in (500, 1000, 3000, 5000, 10000)),
  amount_total integer not null check (amount_total > 0),
  platform_fee integer not null default 0 check (platform_fee >= 0),
  net_amount integer not null default 0 check (net_amount >= 0),
  currency text not null default 'jpy',
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method text not null default 'stripe'
    check (payment_method in ('stripe', 'test')),
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  refunded_at timestamptz
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);
create index if not exists stripe_customers_stripe_customer_id_idx
  on public.stripe_customers (stripe_customer_id);

alter table public.point_transactions
  add column if not exists payment_id uuid references public.payments(id) on delete set null;

alter table public.payments enable row level security;
alter table public.stripe_customers enable row level security;

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all payments" on public.payments;
create policy "Admins can view all payments"
  on public.payments for select
  using (public.is_admin());

drop policy if exists "Users can view own stripe customer" on public.stripe_customers;
create policy "Users can view own stripe customer"
  on public.stripe_customers for select
  using (auth.uid() = user_id);

alter table public.point_transactions drop constraint if exists point_transactions_amount_check;
alter table public.point_transactions add constraint point_transactions_amount_check
  check (amount in (500, 1000, 3000, 5000, 10000));

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
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_amount not in (500, 1000, 3000, 5000, 10000) then
    raise exception 'INVALID_AMOUNT';
  end if;

  select account_type
  into v_user_type
  from public.profiles
  where id = v_user_id;

  if v_user_type is null or v_user_type <> 'fan' then
    raise exception 'NOT_FAN';
  end if;

  perform set_config('app.allow_point_update', 'true', true);

  update public.profiles
  set
    point_balance = point_balance + p_amount,
    updated_at = now()
  where id = v_user_id;

  insert into public.point_transactions (user_id, amount, transaction_type, payment_method)
  values (v_user_id, p_amount, 'purchase', 'test')
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

create or replace function public.fulfill_stripe_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_transaction_id uuid;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  if v_payment.status = 'completed' then
    return;
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'INVALID_PAYMENT_STATUS';
  end if;

  perform set_config('app.allow_point_update', 'true', true);

  update public.profiles
  set
    point_balance = point_balance + v_payment.point_amount,
    updated_at = now()
  where id = v_payment.user_id;

  insert into public.point_transactions (
    user_id,
    amount,
    transaction_type,
    payment_method,
    payment_id
  )
  values (
    v_payment.user_id,
    v_payment.point_amount,
    'purchase',
    'stripe',
    v_payment.id
  )
  returning id into v_transaction_id;

  update public.payments
  set
    status = 'completed',
    completed_at = now()
  where id = p_payment.id;
end;
$$;

create or replace function public.refund_stripe_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_balance integer;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  if v_payment.status = 'refunded' then
    return;
  end if;

  if v_payment.status <> 'completed' then
    raise exception 'INVALID_PAYMENT_STATUS';
  end if;

  select point_balance into v_balance
  from public.profiles
  where id = v_payment.user_id;

  perform set_config('app.allow_point_update', 'true', true);

  update public.profiles
  set
    point_balance = greatest(0, v_balance - v_payment.point_amount),
    updated_at = now()
  where id = v_payment.user_id;

  update public.payments
  set
    status = 'refunded',
    refunded_at = now()
  where id = v_payment.id;
end;
$$;

revoke all on function public.fulfill_stripe_payment(uuid) from public;
revoke all on function public.refund_stripe_payment(uuid) from public;
grant execute on function public.fulfill_stripe_payment(uuid) to service_role;
grant execute on function public.refund_stripe_payment(uuid) to service_role;
