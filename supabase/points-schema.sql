-- Run this in the Supabase SQL Editor AFTER gifts-schema.sql

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null check (amount in (500, 1000, 3000, 5000)),
  transaction_type text not null default 'purchase'
    check (transaction_type in ('purchase')),
  payment_method text not null default 'test'
    check (payment_method in ('test', 'stripe')),
  created_at timestamptz not null default now()
);

create index if not exists point_transactions_user_id_idx
  on public.point_transactions (user_id);

create index if not exists point_transactions_created_at_idx
  on public.point_transactions (created_at desc);

alter table public.point_transactions enable row level security;

drop policy if exists "Users can view own point transactions" on public.point_transactions;
create policy "Users can view own point transactions"
  on public.point_transactions for select
  using (auth.uid() = user_id);

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

  if p_amount not in (500, 1000, 3000, 5000) then
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

grant execute on function public.purchase_points(integer) to authenticated;
