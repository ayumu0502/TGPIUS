-- Run in Supabase SQL Editor AFTER stripe-schema.sql
-- Idempotent point fulfillment for Stripe Checkout sessions (webhook / success page fallback)

create or replace function public.fulfill_stripe_session_metadata(
  p_checkout_session_id text,
  p_user_id uuid,
  p_point_amount integer,
  p_amount_total integer,
  p_payment_intent_id text default null,
  p_stripe_customer_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_payment_id uuid;
  v_platform_fee integer;
  v_net_amount integer;
begin
  if p_point_amount not in (1000, 3000, 5000, 10000, 30000, 50000, 100000) then
    raise exception 'INVALID_AMOUNT';
  end if;

  select * into v_payment
  from public.payments
  where stripe_checkout_session_id = p_checkout_session_id
  for update;

  if found then
    if v_payment.status = 'completed' then
      return v_payment.id;
    end if;

    update public.payments
    set
      stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
      stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id)
    where id = v_payment.id;

    perform public.fulfill_stripe_payment(v_payment.id);
    return v_payment.id;
  end if;

  v_platform_fee := floor(p_amount_total * 0.1);
  v_net_amount := p_amount_total - v_platform_fee;

  insert into public.payments (
    user_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    stripe_customer_id,
    point_amount,
    amount_total,
    platform_fee,
    net_amount,
    status,
    payment_method,
    metadata
  )
  values (
    p_user_id,
    p_checkout_session_id,
    p_payment_intent_id,
    p_stripe_customer_id,
    p_point_amount,
    p_amount_total,
    v_platform_fee,
    v_net_amount,
    'pending',
    'stripe',
    jsonb_build_object('source', 'session_metadata')
  )
  on conflict (stripe_checkout_session_id) do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    select id into v_payment_id
    from public.payments
    where stripe_checkout_session_id = p_checkout_session_id;
  end if;

  if v_payment_id is null then
    raise exception 'PAYMENT_INSERT_FAILED';
  end if;

  perform public.fulfill_stripe_payment(v_payment_id);
  return v_payment_id;
end;
$$;

revoke all on function public.fulfill_stripe_session_metadata(text, uuid, integer, integer, text, text) from public;
grant execute on function public.fulfill_stripe_session_metadata(text, uuid, integer, integer, text, text) to service_role;
