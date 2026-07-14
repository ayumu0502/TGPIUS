"use client";

import { useActionState } from "react";
import { adminUpdateAthleteProfileProxy } from "@/app/actions/admin-athlete-profile";
import { AuthAlert } from "@/components/auth/AuthInput";
import { ATHLETE_REVIEW_STATUS_LABELS } from "@/types/athlete-application";
import type { AdminAthleteFormState } from "@/types/athlete-invite";

type AdminAthleteProxyEditFormProps = {
  userId: string;
  profile: {
    name: string;
    sport: string;
    team: string;
    agency: string;
    region: string;
    career_history: string;
    achievements: string;
    bio: string;
    goals: string;
    instagram_url: string;
    tiktok_url: string;
    x_url: string;
    youtube_url: string;
    is_profile_public: boolean;
    athlete_review_status: string;
  };
};

export default function AdminAthleteProxyEditForm({
  userId,
  profile,
}: AdminAthleteProxyEditFormProps) {
  const [state, formAction, isPending] = useActionState<
    AdminAthleteFormState | null,
    FormData
  >(adminUpdateAthleteProfileProxy, null);

  return (
    <form action={formAction} className="premium-card space-y-4 p-6">
      <input type="hidden" name="user_id" value={userId} />
      {state?.error ? <AuthAlert type="error" message={state.error} /> : null}
      {state?.success ? <AuthAlert type="success" message={state.success} /> : null}
      <input name="name" defaultValue={profile.name} placeholder="氏名" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <input name="sport" defaultValue={profile.sport} placeholder="競技" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <input name="team" defaultValue={profile.team} placeholder="所属チーム" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <input name="agency" defaultValue={profile.agency} placeholder="所属事務所" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <input name="region" defaultValue={profile.region} placeholder="地域" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <textarea name="bio" defaultValue={profile.bio} rows={3} placeholder="自己紹介" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <textarea name="career_history" defaultValue={profile.career_history} rows={3} placeholder="経歴" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <textarea name="achievements" defaultValue={profile.achievements} rows={3} placeholder="実績" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <textarea name="goals" defaultValue={profile.goals} rows={2} placeholder="目標" className="w-full rounded-xl border px-4 py-3 text-sm" />
      <select name="review_status" defaultValue={profile.athlete_review_status} className="w-full rounded-xl border px-4 py-3 text-sm">
        {Object.entries(ATHLETE_REVIEW_STATUS_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_profile_public" defaultChecked={profile.is_profile_public} />
        公開プロフィール
      </label>
      <button type="submit" disabled={isPending} className="btn-gold rounded-full px-6 py-2.5 text-sm">
        代理更新
      </button>
    </form>
  );
}
