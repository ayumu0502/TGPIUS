-- Run this in the Supabase SQL Editor AFTER messages-schema.sql

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (
    type in (
      'like',
      'comment',
      'gift',
      'dm',
      'follow',
      'point_purchase',
      'announcement',
      'athlete_application'
    )
  ),
  title text not null,
  body text not null default '',
  link_url text not null default '/notifications',
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_id_idx
  on public.notifications (recipient_id);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, is_read)
  where is_read = false;

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "Admins can view all notifications" on public.notifications;
create policy "Admins can view all notifications"
  on public.notifications for select
  using (public.is_admin());

create or replace function public.create_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text default '',
  p_link_url text default '/notifications',
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
begin
  if p_recipient_id is null then
    return null;
  end if;

  if p_actor_id is not null and p_actor_id = p_recipient_id
     and p_type not in ('point_purchase', 'announcement') then
    return null;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    title,
    body,
    link_url,
    entity_type,
    entity_id
  )
  values (
    p_recipient_id,
    p_actor_id,
    p_type,
    p_title,
    coalesce(p_body, ''),
    coalesce(nullif(p_link_url, ''), '/notifications'),
    p_entity_type,
    p_entity_id
  )
  returning id into v_notification_id;

  return v_notification_id;
end;
$$;

revoke all on function public.create_notification(uuid, uuid, text, text, text, text, text, uuid) from public;
grant execute on function public.create_notification(uuid, uuid, text, text, text, text, text, uuid) to service_role;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set
    is_read = true,
    read_at = now()
  where id = p_notification_id
    and recipient_id = auth.uid();
end;
$$;

grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set
    is_read = true,
    read_at = now()
  where recipient_id = auth.uid()
    and is_read = false;
end;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;

create or replace function public.admin_broadcast_announcement(
  p_title text,
  p_body text default '',
  p_link_url text default '/notifications'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_profile record;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  for v_profile in
    select id from public.profiles where is_suspended = false
  loop
    perform public.create_notification(
      v_profile.id,
      null,
      'announcement',
      p_title,
      p_body,
      p_link_url,
      null,
      null
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.admin_broadcast_announcement(text, text, text) to authenticated;

-- Trigger: like
create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_actor_name text;
begin
  select user_id into v_owner_id from public.posts where id = new.post_id;
  if v_owner_id is null or v_owner_id = new.user_id then
    return new;
  end if;

  select name into v_actor_name from public.profiles where id = new.user_id;

  perform public.create_notification(
    v_owner_id,
    new.user_id,
    'like',
    coalesce(v_actor_name, 'ユーザー') || 'さんがあなたの投稿にいいねしました',
    '',
    '/feed#post-' || new.post_id::text,
    'post',
    new.post_id
  );

  return new;
end;
$$;

drop trigger if exists notify_on_like_trigger on public.likes;
create trigger notify_on_like_trigger
  after insert on public.likes
  for each row execute function public.notify_on_like();

-- Trigger: comment
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_actor_name text;
  v_preview text;
begin
  select user_id into v_owner_id from public.posts where id = new.post_id;
  if v_owner_id is null or v_owner_id = new.user_id then
    return new;
  end if;

  select name into v_actor_name from public.profiles where id = new.user_id;
  v_preview := left(new.content, 80);

  perform public.create_notification(
    v_owner_id,
    new.user_id,
    'comment',
    coalesce(v_actor_name, 'ユーザー') || 'さんがコメントしました',
    v_preview,
    '/feed#post-' || new.post_id::text,
    'post',
    new.post_id
  );

  return new;
end;
$$;

drop trigger if exists notify_on_comment_trigger on public.comments;
create trigger notify_on_comment_trigger
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Trigger: gift
create or replace function public.notify_on_gift()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
begin
  select name into v_sender_name from public.profiles where id = new.sender_id;

  perform public.create_notification(
    new.receiver_id,
    new.sender_id,
    'gift',
    coalesce(v_sender_name, 'ファン') || 'さんからギフトが届きました',
    new.amount::text || ' pt · ' || left(coalesce(new.message, ''), 60),
    '/athlete/gifts',
    'gift',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists notify_on_gift_trigger on public.gifts;
create trigger notify_on_gift_trigger
  after insert on public.gifts
  for each row execute function public.notify_on_gift();

-- Trigger: DM
create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient_id uuid;
  v_sender_name text;
  v_preview text;
begin
  select cm.user_id
  into v_recipient_id
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id
  limit 1;

  if v_recipient_id is null then
    return new;
  end if;

  select name into v_sender_name from public.profiles where id = new.sender_id;
  v_preview := left(new.content, 80);

  perform public.create_notification(
    v_recipient_id,
    new.sender_id,
    'dm',
    coalesce(v_sender_name, 'ユーザー') || 'さんからメッセージ',
    v_preview,
    '/messages/' || new.conversation_id::text,
    'conversation',
    new.conversation_id
  );

  return new;
end;
$$;

drop trigger if exists notify_on_message_trigger on public.messages;
create trigger notify_on_message_trigger
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- Trigger: point purchase
create or replace function public.notify_on_point_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    new.user_id,
    null,
    'point_purchase',
    'ポイント購入が完了しました',
    new.amount::text || ' pt が残高に反映されました',
    '/points/purchase',
    'point_transaction',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists notify_on_point_purchase_trigger on public.point_transactions;
create trigger notify_on_point_purchase_trigger
  after insert on public.point_transactions
  for each row
  when (new.transaction_type = 'purchase')
  execute function public.notify_on_point_purchase();

-- Follow notifications: helper for future follow feature
create or replace function public.notify_follow(
  p_follower_id uuid,
  p_following_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_follower_name text;
begin
  if p_follower_id is null or p_following_id is null
     or p_follower_id = p_following_id then
    return null;
  end if;

  select name into v_follower_name from public.profiles where id = p_follower_id;

  return public.create_notification(
    p_following_id,
    p_follower_id,
    'follow',
    coalesce(v_follower_name, 'ユーザー') || 'さんがフォローしました',
    '',
    '/profile/' || p_follower_id::text,
    'profile',
    p_follower_id
  );
end;
$$;

grant execute on function public.notify_follow(uuid, uuid) to authenticated;
