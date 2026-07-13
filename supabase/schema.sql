-- Run this in the Supabase SQL Editor for your project.

create type public.account_type as enum ('fan', 'athlete', 'sponsor');

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  account_type public.account_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_account_type_idx on public.profiles (account_type);
create index if not exists profiles_email_idx on public.profiles (email);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(
      (new.raw_user_meta_data->>'account_type')::public.account_type,
      'fan'::public.account_type
    )
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    account_type = excluded.account_type,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
