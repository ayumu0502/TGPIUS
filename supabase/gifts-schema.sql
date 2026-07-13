-- Run this in the Supabase SQL Editor AFTER schema.sql and posts-schema.sql

-- Test point balance for fans (default 10,000 pt)
alter table public.profiles
  add column if not exists point_balance integer not null default 10000
  check (point_balance >= 0);

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null check (amount in (100, 500, 1000, 3000)),
  message text not null default '' check (char_length(message) <= 200),
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index if not exists gifts_sender_id_idx on public.gifts (sender_id);
create index if not exists gifts_receiver_id_idx on public.gifts (receiver_id);
create index if not exists gifts_created_at_idx on public.gifts (created_at desc);

alter table public.gifts enable row level security;

drop policy if exists "Users can view sent gifts" on public.gifts;
create policy "Users can view sent gifts"
  on public.gifts for select
  using (auth.uid() = sender_id);

drop policy if exists "Users can view received gifts" on public.gifts;
create policy "Users can view received gifts"
  on public.gifts for select
  using (auth.uid() = receiver_id);

-- Prevent direct point_balance manipulation from the client
create or replace function public.prevent_point_balance_update()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.allow_point_update', true) = 'true' then
    return new;
  end if;

  if new.point_balance is distinct from old.point_balance then
    raise exception 'POINT_BALANCE_READONLY';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_point_balance_update_trigger on public.profiles;

create trigger prevent_point_balance_update_trigger
  before update on public.profiles
  for each row execute function public.prevent_point_balance_update();

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
begin
  if v_sender_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_amount not in (100, 500, 1000, 3000) then
    raise exception 'INVALID_AMOUNT';
  end if;

  if char_length(v_message) > 200 then
    raise exception 'MESSAGE_TOO_LONG';
  end if;

  if v_sender_id = p_receiver_id then
    raise exception 'SELF_GIFT';
  end if;

  select account_type, point_balance
  into v_sender_type, v_balance
  from public.profiles
  where id = v_sender_id;

  if v_sender_type is null or v_sender_type <> 'fan' then
    raise exception 'SENDER_NOT_FAN';
  end if;

  select account_type
  into v_receiver_type
  from public.profiles
  where id = p_receiver_id;

  if v_receiver_type is null or v_receiver_type <> 'athlete' then
    raise exception 'RECEIVER_NOT_ATHLETE';
  end if;

  if v_balance < p_amount then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  perform set_config('app.allow_point_update', 'true', true);

  update public.profiles
  set
    point_balance = point_balance - p_amount,
    updated_at = now()
  where id = v_sender_id;

  insert into public.gifts (sender_id, receiver_id, amount, message)
  values (v_sender_id, p_receiver_id, p_amount, v_message)
  returning id into v_gift_id;

  return v_gift_id;
end;
$$;

grant execute on function public.send_gift(uuid, integer, text) to authenticated;
