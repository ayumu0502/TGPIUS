"use client";

import { useActionState } from "react";
import { submitAthleteApplication } from "@/app/actions/athlete-application";
import { AuthAlert } from "@/components/auth/AuthInput";
import {
  ATHLETE_REVIEW_STATUS_LABELS,
  type AthleteApplication,
  type AthleteReviewStatus,
} from "@/types/athlete-application";

type AthleteApplicationFormProps = {
  canSubmit: boolean;
  currentStatus: AthleteReviewStatus | null | undefined;
  latestApplication: AthleteApplication | null;
};

function StatusBadge({ status }: { status: AthleteReviewStatus | null | undefined }) {
  const label = status ? ATHLETE_REVIEW_STATUS_LABELS[status] : "未設定";
  const tone =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "pending"
        ? "bg-amber-50 text-amber-700"
        : status === "rejected" || status === "suspended"
          ? "bg-red-50 text-red-600"
          : "bg-[var(--surface)] text-[var(--text-secondary)]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
      {children}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </label>
  );
}

function TextInput({
  id,
  name,
  defaultValue,
  placeholder,
  error,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function TextArea({
  id,
  name,
  defaultValue,
  placeholder,
  rows = 4,
  error,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  error?: string;
}) {
  return (
    <div>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

export default function AthleteApplicationForm({
  canSubmit,
  currentStatus,
  latestApplication,
}: AthleteApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(submitAthleteApplication, null);

  return (
    <div className="space-y-6">
      <div className="premium-card p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)]">
              審査ステータス
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              承認後にアスリート機能が利用できます
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>

        {latestApplication?.review_note && currentStatus !== "approved" ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">審査メモ</p>
            <p className="mt-1 whitespace-pre-wrap">{latestApplication.review_note}</p>
          </div>
        ) : null}

        {latestApplication?.submitted_at ? (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            最終申請日時:{" "}
            {new Date(latestApplication.submitted_at).toLocaleString("ja-JP")}
          </p>
        ) : null}
      </div>

      {state?.error ? <AuthAlert type="error" message={state.error} /> : null}
      {state?.success ? <AuthAlert type="success" message={state.success} /> : null}

      {!canSubmit ? (
        <div className="premium-card p-6 text-center sm:p-8">
          {currentStatus === "pending" ? (
            <p className="text-sm text-[var(--text-secondary)]">
              審査中です。結果が届くまでお待ちください。
            </p>
          ) : currentStatus === "approved" ? (
            <p className="text-sm text-[var(--text-secondary)]">
              承認済みです。ダッシュボードから活動を開始できます。
            </p>
          ) : currentStatus === "suspended" ? (
            <p className="text-sm text-[var(--text-secondary)]">
              アスリート機能は利用停止中です。復帰については運営の審査結果をお待ちください。
            </p>
          ) : currentStatus === "rejected" ? (
            <p className="text-sm text-[var(--text-secondary)]">
              申請は却下されました。審査メモを確認のうえ、内容を修正して再提出できます。
            </p>
          ) : currentStatus === "resubmit" ? (
            <p className="text-sm text-[var(--text-secondary)]">
              再提出が必要です。審査メモを確認し、フォームから再申請してください。
            </p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              現在は新規申請を受け付けていません。
            </p>
          )}
        </div>
      ) : (
        <form action={formAction} className="premium-card space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)]">
              選手申請フォーム
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              本人確認書類は管理者のみが確認できます
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="full_name" required>
                氏名
              </FieldLabel>
              <TextInput
                id="full_name"
                name="full_name"
                defaultValue={latestApplication?.full_name}
                placeholder="山田 太郎"
                error={state?.fieldErrors?.full_name}
              />
            </div>
            <div>
              <FieldLabel htmlFor="sport" required>
                競技
              </FieldLabel>
              <TextInput
                id="sport"
                name="sport"
                defaultValue={latestApplication?.sport}
                placeholder="サッカー"
                error={state?.fieldErrors?.sport}
              />
            </div>
            <div>
              <FieldLabel htmlFor="team">所属チーム / 学校</FieldLabel>
              <TextInput
                id="team"
                name="team"
                defaultValue={latestApplication?.team}
                placeholder="〇〇FC / 〇〇大学"
                error={state?.fieldErrors?.team}
              />
            </div>
            <div>
              <FieldLabel htmlFor="region">活動地域</FieldLabel>
              <TextInput
                id="region"
                name="region"
                defaultValue={latestApplication?.region}
                placeholder="東京都"
                error={state?.fieldErrors?.region}
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="career_history">経歴</FieldLabel>
            <TextArea
              id="career_history"
              name="career_history"
              defaultValue={latestApplication?.career_history}
              placeholder="競技歴・所属歴など"
              error={state?.fieldErrors?.career_history}
            />
          </div>

          <div>
            <FieldLabel htmlFor="achievements">実績</FieldLabel>
            <TextArea
              id="achievements"
              name="achievements"
              defaultValue={latestApplication?.achievements}
              placeholder="大会結果・受賞歴など"
              error={state?.fieldErrors?.achievements}
            />
          </div>

          <div>
            <FieldLabel htmlFor="bio">自己紹介</FieldLabel>
            <TextArea
              id="bio"
              name="bio"
              defaultValue={latestApplication?.bio}
              placeholder="ファンへのメッセージ"
              error={state?.fieldErrors?.bio}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="instagram_url">Instagram</FieldLabel>
              <TextInput
                id="instagram_url"
                name="instagram_url"
                defaultValue={latestApplication?.instagram_url}
                placeholder="https://instagram.com/..."
                error={state?.fieldErrors?.instagram_url}
              />
            </div>
            <div>
              <FieldLabel htmlFor="tiktok_url">TikTok</FieldLabel>
              <TextInput
                id="tiktok_url"
                name="tiktok_url"
                defaultValue={latestApplication?.tiktok_url}
                placeholder="https://tiktok.com/..."
                error={state?.fieldErrors?.tiktok_url}
              />
            </div>
            <div>
              <FieldLabel htmlFor="x_url">X (Twitter)</FieldLabel>
              <TextInput
                id="x_url"
                name="x_url"
                defaultValue={latestApplication?.x_url}
                placeholder="https://x.com/..."
                error={state?.fieldErrors?.x_url}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="profile_image">プロフィール画像</FieldLabel>
              <input
                id="profile_image"
                name="profile_image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(197,160,89,0.12)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--gold-dark)]"
              />
              {state?.fieldErrors?.profile_image ? (
                <p className="mt-1 text-xs text-red-500">
                  {state.fieldErrors.profile_image}
                </p>
              ) : null}
            </div>
            <div>
              <FieldLabel htmlFor="identity_doc" required>
                本人確認書類
              </FieldLabel>
              <input
                id="identity_doc"
                name="identity_doc"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(197,160,89,0.12)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--gold-dark)]"
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                運転免許証・パスポート・学生証など（JPEG/PNG/WebP/PDF・10MB以下）
              </p>
              {state?.fieldErrors?.identity_doc ? (
                <p className="mt-1 text-xs text-red-500">
                  {state.fieldErrors.identity_doc}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-gold w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {isPending ? "送信中..." : "申請を送信する"}
          </button>
        </form>
      )}
    </div>
  );
}
