-- Run AFTER athlete-application-schema.sql and notifications-athlete-application-hotfix.sql
-- Adds athlete reinstate action for admin review

alter table public.athlete_application_audit_log
  drop constraint if exists athlete_application_audit_log_action_check;

alter table public.athlete_application_audit_log
  add constraint athlete_application_audit_log_action_check
  check (action in (
    'submitted',
    'approved',
    'rejected',
    'resubmit_requested',
    'suspended',
    'reinstated',
    'note'
  ));

create or replace function public.admin_review_athlete_application(
  p_application_id uuid,
  p_action text,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_app public.athlete_applications%rowtype;
  v_prev_status public.athlete_review_status;
  v_new_status public.athlete_review_status;
  v_note text := trim(coalesce(p_note, ''));
  v_action text := lower(trim(coalesce(p_action, '')));
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select * into v_app
  from public.athlete_applications
  where id = p_application_id;

  if not found then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;

  select athlete_review_status into v_prev_status
  from public.profiles
  where id = v_app.user_id;

  if v_action = 'approve' then
    v_new_status := 'approved';

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    update public.profiles
    set
      name = v_app.full_name,
      sport = v_app.sport,
      team = v_app.team,
      region = v_app.region,
      career_history = v_app.career_history,
      achievements = v_app.achievements,
      bio = v_app.bio,
      instagram_url = v_app.instagram_url,
      tiktok_url = v_app.tiktok_url,
      x_url = v_app.x_url,
      avatar_url = coalesce(v_app.profile_image_url, avatar_url),
      athlete_review_status = v_new_status,
      is_verified = true,
      updated_at = now()
    where id = v_app.user_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      '選手申請が承認されました',
      'アスリートとしての活動を開始できます。',
      '/athlete/dashboard',
      'athlete_application',
      p_application_id
    );

  elsif v_action = 'reject' then
    v_new_status := 'rejected';

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    update public.profiles
    set athlete_review_status = v_new_status, updated_at = now()
    where id = v_app.user_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      '選手申請が却下されました',
      case when v_note <> '' then v_note else '詳細は申請ページをご確認ください。' end,
      '/athlete/apply',
      'athlete_application',
      p_application_id
    );

  elsif v_action = 'resubmit_request' then
    v_new_status := 'resubmit';

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    update public.profiles
    set athlete_review_status = v_new_status, updated_at = now()
    where id = v_app.user_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      '選手申請の再提出をお願いします',
      case when v_note <> '' then v_note else '申請内容を修正のうえ、再提出してください。' end,
      '/athlete/apply',
      'athlete_application',
      p_application_id
    );

  elsif v_action = 'suspend' then
    v_new_status := 'suspended';

    update public.profiles
    set athlete_review_status = v_new_status, updated_at = now()
    where id = v_app.user_id;

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      'アスリート機能が利用停止されました',
      case when v_note <> '' then v_note else '運営にお問い合わせください。' end,
      '/athlete/apply',
      'athlete_application',
      p_application_id
    );

  elsif v_action = 'reinstate' then
    if v_prev_status is distinct from 'suspended' then
      raise exception 'REINSTATE_NOT_ALLOWED';
    end if;

    v_new_status := 'approved';

    update public.profiles
    set
      athlete_review_status = v_new_status,
      is_verified = true,
      updated_at = now()
    where id = v_app.user_id;

    update public.athlete_applications
    set
      status = v_new_status,
      review_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;

    perform public.create_notification(
      v_app.user_id,
      v_admin_id,
      'athlete_application',
      'アスリート機能が復帰しました',
      case when v_note <> '' then v_note else '引き続き活動をお楽しみください。' end,
      '/athlete/dashboard',
      'athlete_application',
      p_application_id
    );

  else
    raise exception 'INVALID_ACTION';
  end if;

  insert into public.athlete_application_audit_log (
    application_id, user_id, admin_id, action, previous_status, new_status, note
  )
  values (
    p_application_id,
    v_app.user_id,
    v_admin_id,
    case v_action
      when 'approve' then 'approved'
      when 'reject' then 'rejected'
      when 'resubmit_request' then 'resubmit_requested'
      when 'suspend' then 'suspended'
      when 'reinstate' then 'reinstated'
      else v_action
    end,
    v_prev_status,
    v_new_status,
    v_note
  );
end;
$$;
