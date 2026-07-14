"use client";

import { useActionState } from "react";
import { createProvisionalAthlete } from "@/app/actions/admin-athletes";
import { AuthAlert } from "@/components/auth/AuthInput";
import { ATHLETE_REVIEW_STATUS_LABELS } from "@/types/athlete-application";
import type { AdminAthleteFormState, Organization } from "@/types/athlete-invite";

type AdminAthleteNewFormProps = {
  organizations: Organization[];
};

export default function AdminAthleteNewForm({ organizations }: AdminAthleteNewFormProps) {
  const [state, formAction, isPending] = useActionState<
    AdminAthleteFormState | null,
    FormData
  >(createProvisionalAthlete, null);

  return (
    <form action={formAction} className="premium-card space-y-6 p-6 sm:p-8">
      {state?.error ? <AuthAlert type="error" message={state.error} /> : null}
      {state?.success ? <AuthAlert type="success" message={state.success} /> : null}
      {state?.inviteUrl ? (
        <div className="rounded-xl border border-[rgba(197,160,89,0.3)] bg-[rgba(197,160,89,0.08)] px-4 py-3 text-sm">
          <p className="font-medium text-[var(--gold-dark)]">招待URL</p>
          <p className="mt-1 break-all text-[var(--text-secondary)]">{state.inviteUrl}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="氏名" name="full_name" required />
        <Field label="メールアドレス" name="email" type="email" required />
        <Field label="競技" name="sport" required />
        <Field label="所属チーム" name="team" />
        <Field label="所属事務所" name="agency" />
        <Field label="活動地域" name="region" />
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">所属組織</label>
          <select
            name="organization_id"
            className="w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm"
            defaultValue=""
          >
            <option value="">選択なし</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">審査状態</label>
          <select
            name="review_status"
            defaultValue="approved"
            className="w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm"
          >
            {Object.entries(ATHLETE_REVIEW_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">管理メモ</label>
          <textarea
            name="admin_note"
            rows={3}
            className="w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">お問い合わせ内容（下書き）</label>
          <textarea name="bio" rows={4} placeholder="自己紹介の下書き" className="w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm" />
        </div>
        <Field label="経歴（下書き）" name="career_history" multiline />
        <Field label="実績（下書き）" name="achievements" multiline />
        <Field label="目標（下書き）" name="goals" multiline />
        <Field label="招待期限（日数）" name="expires_days" type="number" defaultValue="14" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_public" className="rounded" />
        公開プロフィールとして下書きを作成（非公開の場合は管理者のみ閲覧）
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="send_invite" defaultChecked className="rounded" />
        仮登録と同時に招待メールを送信
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="btn-gold rounded-full px-8 py-3 text-sm disabled:opacity-60"
      >
        {isPending ? "登録中..." : "アスリートを仮登録"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  multiline,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  defaultValue?: string;
}) {
  const className = "w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm";
  return (
    <div className={multiline ? "sm:col-span-2" : ""}>
      <label className="mb-2 block text-sm font-medium">
        {label}
        {required ? <span className="text-[var(--gold-dark)]"> *</span> : null}
      </label>
      {multiline ? (
        <textarea name={name} rows={3} className={className} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className={className}
        />
      )}
    </div>
  );
}
