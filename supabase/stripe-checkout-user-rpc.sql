-- Optional: run in Supabase SQL Editor if SUPABASE_SERVICE_ROLE_KEY is not set locally.
-- Enables Stripe Checkout using the logged-in user's session (no service role on dev machine).

create or replace function public.init_stripe_payment(
  p_point_amount integer,
  p_amount_total integer,
  p_platform_fee integer,
  p_net_amount integer,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_payment_id uuid;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_point_amount not in (1000, 3000, 5000, 10000, 30000, 50000, 100000) then
    raise exception 'INVALID_AMOUNT';
  end if;

  insert into public.payments (
    user_id,
    point_amount,
    amount_total,
    platform_fee,
    net_amount,
    status,
    payment_method,
    metadata
  )
  values (
    v_user_id,
    p_point_amount,
    p_amount_total,
    p_platform_fee,
    p_net_amount,
    'pending',
    'stripe',
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

create or replace function public.link_stripe_customer(p_stripe_customer_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into public.stripe_customers (user_id, stripe_customer_id, updated_at)
  values (v_user_id, p_stripe_customer_id, now())
  on conflict (user_id) do update
  set stripe_customer_id = excluded.stripe_customer_id,
      updated_at = now();
end;
$$;

create or replace function public.update_stripe_payment_session(
  p_payment_id uuid,
  p_checkout_session_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  update public.payments
  set stripe_checkout_session_id = p_checkout_session_id
  where id = p_payment_id
    and user_id = v_user_id
    and status = 'pending';

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;
end;
$$;

create or replace function public.mark_stripe_payment_failed(
  p_payment_id uuid,
  p_failure_message text default 'Checkout creation failed'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  update public.payments
  set status = 'failed',
      failure_message = p_failure_message
  where id = p_payment_id
    and user_id = v_user_id
    and status = 'pending';
end;
$$;

create or replace function public.fulfill_stripe_payment_for_user(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id
    and user_id = v_user_id
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
  where id = p_payment_id;
end;
$$;

revoke all on function public.init_stripe_payment(integer, integer, integer, integer, jsonb) from public;
revoke all on function public.link_stripe_customer(text) from public;
revoke all on function public.update_stripe_payment_session(uuid, text) from public;
revoke all on function public.mark_stripe_payment_failed(uuid, text) from public;
revoke all on function public.fulfill_stripe_payment_for_user(uuid) from public;

grant execute on function public.init_stripe_payment(integer, integer, integer, integer, jsonb) to authenticated;
grant execute on function public.link_stripe_customer(text) to authenticated;
grant execute on function public.update_stripe_payment_session(uuid, text) to authenticated;
grant execute on function public.mark_stripe_payment_failed(uuid, text) to authenticated;
grant execute on function public.fulfill_stripe_payment_for_user(uuid) to authenticated;
