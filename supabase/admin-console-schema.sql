-- Admin console extensions: audit log, content moderation, report management
--
-- PREREQUISITES (run these BEFORE this file if not already applied):
--   - admin-schema.sql          (is_admin)
--   - posts-schema.sql          (posts, comments)
--   - events-schema.sql         (events) — optional for event moderation
--   - fanclub-schema.sql        (fanclub_posts) — optional for exclusive content moderation
--   - messages-hotfix.sql       (user_reports, user_blocks) — optional for report moderation
--   - notifications-schema.sql  (create_notification) — required for announcements
--
-- If fanclub_posts does not exist yet, run fanclub-schema.sql first, then re-run this file.

-- ---------------------------------------------------------------------------
-- Global admin audit log
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_admin_id_idx
  on public.admin_audit_log (admin_id, created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Admins can view audit log" on public.admin_audit_log;
create policy "Admins can view audit log"
  on public.admin_audit_log for select
  using (public.is_admin());

create or replace function public.admin_log_action(
  p_action text,
  p_target_type text,
  p_target_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  insert into public.admin_audit_log (
    admin_id, action, target_type, target_id, metadata, note
  )
  values (
    auth.uid(),
    trim(p_action),
    trim(p_target_type),
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb),
    trim(coalesce(p_note, ''))
  );
end;
$$;

grant execute on function public.admin_log_action(text, text, uuid, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin content policies
-- ---------------------------------------------------------------------------

drop policy if exists "Admins can view all posts" on public.posts;
create policy "Admins can view all posts"
  on public.posts for select
  using (public.is_admin());

drop policy if exists "Admins can delete any post" on public.posts;
create policy "Admins can delete any post"
  on public.posts for delete
  using (public.is_admin());

drop policy if exists "Admins can view all comments" on public.comments;
create policy "Admins can view all comments"
  on public.comments for select
  using (public.is_admin());

drop policy if exists "Admins can delete any comment" on public.comments;
create policy "Admins can delete any comment"
  on public.comments for delete
  using (public.is_admin());

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'events'
  ) then
    execute 'drop policy if exists "Admins can view all events" on public.events';
    execute 'create policy "Admins can view all events"
      on public.events for select
      using (public.is_admin())';
    execute 'drop policy if exists "Admins can update all events" on public.events';
    execute 'create policy "Admins can update all events"
      on public.events for update
      using (public.is_admin())';
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'fanclub_posts'
  ) then
    execute 'drop policy if exists "Admins can view all fanclub posts" on public.fanclub_posts';
    execute 'create policy "Admins can view all fanclub posts"
      on public.fanclub_posts for select
      using (public.is_admin())';
    execute 'drop policy if exists "Admins can delete fanclub posts" on public.fanclub_posts';
    execute 'create policy "Admins can delete fanclub posts"
      on public.fanclub_posts for delete
      using (public.is_admin())';
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_reports'
  ) then
    execute 'drop policy if exists "Admins can update reports" on public.user_reports';
    execute 'create policy "Admins can update reports"
      on public.user_reports for update
      using (public.is_admin())';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Admin moderation RPCs
-- ---------------------------------------------------------------------------

create or replace function public.admin_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception 'POST_NOT_FOUND';
  end if;
  delete from public.posts where id = p_post_id;
  perform public.admin_log_action('delete_post', 'post', p_post_id);
end;
$$;

grant execute on function public.admin_delete_post(uuid) to authenticated;

create or replace function public.admin_delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if not exists (select 1 from public.comments where id = p_comment_id) then
    raise exception 'COMMENT_NOT_FOUND';
  end if;
  delete from public.comments where id = p_comment_id;
  perform public.admin_log_action('delete_comment', 'comment', p_comment_id);
end;
$$;

grant execute on function public.admin_delete_comment(uuid) to authenticated;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'events'
  ) then
    execute $fn$
      create or replace function public.admin_cancel_event(p_event_id uuid, p_note text default '')
      returns void
      language plpgsql
      security definer
      set search_path = public
      as $body$
      begin
        if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
        if not exists (select 1 from public.events where id = p_event_id) then
          raise exception 'EVENT_NOT_FOUND';
        end if;
        update public.events
        set status = 'cancelled', updated_at = now()
        where id = p_event_id;
        perform public.admin_log_action(
          'cancel_event', 'event', p_event_id, '{}'::jsonb, trim(coalesce(p_note, ''))
        );
      end;
      $body$;
    $fn$;
    execute 'grant execute on function public.admin_cancel_event(uuid, text) to authenticated';
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'fanclub_posts'
  ) then
    execute $fn$
      create or replace function public.admin_delete_fanclub_post(p_post_id uuid)
      returns void
      language plpgsql
      security definer
      set search_path = public
      as $body$
      begin
        if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
        if not exists (select 1 from public.fanclub_posts where id = p_post_id) then
          raise exception 'POST_NOT_FOUND';
        end if;
        delete from public.fanclub_posts where id = p_post_id;
        perform public.admin_log_action('delete_fanclub_post', 'fanclub_post', p_post_id);
      end;
      $body$;
    $fn$;
    execute 'grant execute on function public.admin_delete_fanclub_post(uuid) to authenticated';
  end if;
end $$;

create or replace function public.admin_update_report_status(
  p_report_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := trim(coalesce(p_status, ''));
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if v_status not in ('pending', 'reviewed', 'resolved', 'dismissed') then
    raise exception 'INVALID_STATUS';
  end if;
  if not exists (select 1 from public.user_reports where id = p_report_id) then
    raise exception 'REPORT_NOT_FOUND';
  end if;
  update public.user_reports set status = v_status where id = p_report_id;
  perform public.admin_log_action(
    'update_report_status',
    'user_report',
    p_report_id,
    jsonb_build_object('status', v_status)
  );
end;
$$;

grant execute on function public.admin_update_report_status(uuid, text) to authenticated;

-- Log suspend/resume actions
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

  perform public.admin_log_action(
    case when p_suspended then 'suspend_user' else 'resume_user' end,
    'user',
    p_user_id,
    jsonb_build_object('suspended', p_suspended)
  );
end;
$$;

-- Log announcement broadcasts
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
  v_recipient record;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  if trim(coalesce(p_title, '')) = '' then
    raise exception 'TITLE_REQUIRED';
  end if;

  for v_recipient in
    select id from public.profiles where coalesce(is_suspended, false) = false
  loop
    perform public.create_notification(
      v_recipient.id,
      auth.uid(),
      'announcement',
      trim(p_title),
      trim(coalesce(p_body, '')),
      coalesce(nullif(trim(p_link_url), ''), '/notifications'),
      null
    );
    v_count := v_count + 1;
  end loop;

  perform public.admin_log_action(
    'broadcast_announcement',
    'announcement',
    null,
    jsonb_build_object('recipient_count', v_count, 'title', trim(p_title))
  );

  return v_count;
end;
$$;
