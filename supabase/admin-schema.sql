-- Run this in the Supabase SQL Editor AFTER points-schema.sql

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

create index if not exists profiles_is_admin_idx on public.profiles (is_admin);
create index if not exists profiles_is_suspended_idx on public.profiles (is_suspended);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can view all gifts" on public.gifts;
create policy "Admins can view all gifts"
  on public.gifts for select
  using (public.is_admin() or auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Admins can view all point transactions" on public.point_transactions;
create policy "Admins can view all point transactions"
  on public.point_transactions for select
  using (public.is_admin() or auth.uid() = user_id);

create or replace function public.admin_set_user_suspended(
  p_user_id uuid,
  p_suspended boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  if auth.uid() = p_user_id then
    raise exception 'CANNOT_SUSPEND_SELF';
  end if;

  if exists (
    select 1 from public.profiles
    where id = p_user_id and is_admin = true
  ) then
    raise exception 'CANNOT_SUSPEND_ADMIN';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'USER_NOT_FOUND';
  end if;

  update public.profiles
  set
    is_suspended = p_suspended,
    updated_at = now()
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_user_suspended(uuid, boolean) to authenticated;

-- 初回のみ: 管理者にするユーザーのメールアドレスを指定して実行してください
-- update public.profiles set is_admin = true where email = 'your@email.com';
