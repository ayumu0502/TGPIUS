-- Run this in the Supabase SQL Editor AFTER schema.sql and posts-schema.sql

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists sport text default '';
alter table public.profiles add column if not exists team text default '';
alter table public.profiles add column if not exists region text default '';
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists achievements text default '';
alter table public.profiles add column if not exists goals text default '';
alter table public.profiles add column if not exists instagram_url text default '';
alter table public.profiles add column if not exists tiktok_url text default '';
alter table public.profiles add column if not exists x_url text default '';

-- Avatar storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can update own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
