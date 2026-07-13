-- Run this in the Supabase SQL Editor AFTER schema.sql

-- Allow authenticated users to view all profiles (for feed & profile pages)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Authenticated users can view profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create type public.media_type as enum ('image', 'video');

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  caption text default '',
  media_type public.media_type not null,
  media_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists likes_post_id_idx on public.likes (post_id);
create index if not exists comments_post_id_idx on public.comments (post_id);

alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

create policy "Authenticated users can view posts"
  on public.posts for select
  using (auth.role() = 'authenticated');

create policy "Users can create own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

create policy "Authenticated users can view likes"
  on public.likes for select
  using (auth.role() = 'authenticated');

create policy "Users can like posts"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

create policy "Authenticated users can view comments"
  on public.comments for select
  using (auth.role() = 'authenticated');

create policy "Users can add comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Storage bucket for post media
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated users can upload post media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view post media"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "Users can update own post media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own post media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
