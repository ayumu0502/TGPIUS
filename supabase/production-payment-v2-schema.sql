-- TGPLUS Production Payment v2
-- Run in Supabase SQL Editor AFTER production-v1-schema.sql

-- ── Billing records (subscriptions, failures, receipts) ──
create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  record_type text not null
    check (record_type in ('subscription_invoice', 'payment_failed', 'point_purchase', 'refund')),
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  amount_yen integer not null default 0 check (amount_yen >= 0),
  currency text not null default 'jpy',
  status text not null default 'paid'
    check (status in ('paid', 'failed', 'refunded', 'pending')),
  description text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists billing_records_invoice_uidx
  on public.billing_records (stripe_invoice_id)
  where stripe_invoice_id is not null;

create unique index if not exists billing_records_intent_uidx
  on public.billing_records (stripe_payment_intent_id, record_type)
  where stripe_payment_intent_id is not null and record_type = 'payment_failed';

create index if not exists billing_records_user_id_idx
  on public.billing_records (user_id, created_at desc);

alter table public.billing_records enable row level security;

drop policy if exists "Users can view own billing records" on public.billing_records;
create policy "Users can view own billing records"
  on public.billing_records for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all billing records" on public.billing_records;
create policy "Admins can view all billing records"
  on public.billing_records for select
  using (public.is_admin());

-- ── Gift idempotency (double-send prevention) ──
create table if not exists public.gift_idempotency (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  idempotency_key text not null,
  gift_id uuid references public.gifts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (sender_id, idempotency_key)
);

alter table public.gift_idempotency enable row level security;

-- ── Athlete earnings ledger ──
create table if not exists public.athlete_earnings_ledger (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null
    check (source_type in ('gift', 'subscription', 'payout', 'adjustment')),
  source_id uuid,
  gross_amount integer not null default 0,
  platform_fee integer not null default 0,
  net_amount integer not null default 0,
  status text not null default 'settled'
    check (status in ('pending', 'settled', 'reversed')),
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists athlete_earnings_ledger_athlete_idx
  on public.athlete_earnings_ledger (athlete_id, created_at desc);

alter table public.athlete_earnings_ledger enable row level security;

drop policy if exists "Athletes can view own earnings ledger" on public.athlete_earnings_ledger;
create policy "Athletes can view own earnings ledger"
  on public.athlete_earnings_ledger for select
  using (auth.uid() = athlete_id);

drop policy if exists "Admins can view all earnings ledger" on public.athlete_earnings_ledger;
create policy "Admins can view all earnings ledger"
  on public.athlete_earnings_ledger for select
  using (public.is_admin());

-- ── send_gift with idempotency + earnings ledger ──
create or replace function public.send_gift(
  p_receiver_id uuid,
  p_amount integer,
  p_message text default '',
  p_idempotency_key text default null
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
  v_existing_gift uuid;
begin
  if v_sender_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_amount not in (100, 300, 500, 1000, 3000, 10000) then raise exception 'INVALID_AMOUNT'; end if;
  if char_length(v_message) > 200 then raise exception 'MESSAGE_TOO_LONG'; end if;
  if v_sender_id = p_receiver_id then raise exception 'SELF_GIFT'; end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select gift_id into v_existing_gift
    from public.gift_idempotency
    where sender_id = v_sender_id and idempotency_key = trim(p_idempotency_key);

    if v_existing_gift is not null then
      return v_existing_gift;
    end if;
  end if;

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

  insert into public.athlete_earnings_ledger (
    athlete_id, source_type, source_id, gross_amount, platform_fee, net_amount, status, description
  )
  values (
    p_receiver_id, 'gift', v_gift_id, p_amount, v_platform_fee, v_net, 'settled', 'ギフト受取'
  );

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    insert into public.gift_idempotency (sender_id, idempotency_key, gift_id)
    values (v_sender_id, trim(p_idempotency_key), v_gift_id)
    on conflict (sender_id, idempotency_key) do nothing;
  end if;

  return v_gift_id;
end;
$$;

grant execute on function public.send_gift(uuid, integer, text, text) to authenticated;
