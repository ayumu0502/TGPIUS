"use client";

import { useActionState, useState, useTransition } from "react";
import {
  getApplicationAuditLog,
  getIdentityDocSignedUrl,
  reviewAthleteApplication,
} from "@/app/actions/admin-applications";
import { formatAdminDate } from "@/lib/admin/constants";
import {
  ATHLETE_REVIEW_STATUS_LABELS,
  type AdminAthleteApplicationRow,
  type AthleteApplicationAuditEntry,
  type AthleteReviewStatus,
} from "@/types/athlete-application";

type AdminAthleteApplicationsProps = {
  applications: AdminAthleteApplicationRow[];
  initialStatus: AthleteReviewStatus | "all";
  searchQuery: string;
};

const STATUS_OPTIONS: { value: AthleteReviewStatus | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "審査中" },
  { value: "approved", label: "承認" },
  { value: "rejected", label: "却下" },
  { value: "resubmit", label: "再提出依頼" },
  { value: "suspended", label: "利用停止" },
  { value: "not_applied", label: "未申請" },
];

function ReviewForm({
  applicationId,
  action,
  label,
  confirmMessage,
  tone = "default",
}: {
  applicationId: string;
  action: "approve" | "reject" | "resubmit_request" | "suspend";
  label: string;
  confirmMessage: string;
  tone?: "default" | "danger" | "gold";
}) {
  const [state, formAction, isPending] = useActionState(reviewAthleteApplication, null);
  const [note, setNote] = useState("");

  const buttonClass =
    tone === "danger"
      ? "bg-red-50 text-red-600 hover:bg-red-100"
      : tone === "gold"
        ? "btn-gold"
        : "border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--gold)]";

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
      }}
    >
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="action" value={action} />
      <textarea
        name="note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        placeholder="審査メモ（任意）"
        className="w-full rounded-xl border border-[var(--card-border)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className={`w-full rounded-full px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${buttonClass}`}
      >
        {isPending ? "処理中..." : label}
      </button>
      {state?.error ? <p className="text-xs text-red-500">{state.error}</p> : null}
      {state?.success ? <p className="text-xs text-emerald-600">{state.success}</p> : null}
    </form>
  );
}

function ApplicationDetail({
  application,
  onClose,
}: {
  application: AdminAthleteApplicationRow;
  onClose: () => void;
}) {
  const [auditLog, setAuditLog] = useState<AthleteApplicationAuditEntry[]>([]);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadDetail() {
    startTransition(async () => {
      const [log, doc] = await Promise.all([
        getApplicationAuditLog(application.user_id),
        application.identity_doc_path
          ? getIdentityDocSignedUrl(application.identity_doc_path)
          : Promise.resolve({ url: undefined, error: undefined }),
      ]);
      setAuditLog(log);
      setDocUrl(doc.url ?? null);
    });
  }

  return (
    <div className="premium-card p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {application.full_name}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {application.user_email} · {application.sport}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs text-[var(--text-muted)]"
        >
          閉じる
        </button>
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <p>
          <span className="text-[var(--text-muted)]">所属:</span> {application.team || "—"}
        </p>
        <p>
          <span className="text-[var(--text-muted)]">地域:</span> {application.region || "—"}
        </p>
        <p>
          <span className="text-[var(--text-muted)]">ステータス:</span>{" "}
          {ATHLETE_REVIEW_STATUS_LABELS[application.status]}
        </p>
        <p>
          <span className="text-[var(--text-muted)]">申請日:</span>{" "}
          {formatAdminDate(application.submitted_at)}
        </p>
      </div>

      {application.career_history ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">経歴</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{application.career_history}</p>
        </div>
      ) : null}

      {application.achievements ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">実績</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{application.achievements}</p>
        </div>
      ) : null}

      {application.bio ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">自己紹介</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{application.bio}</p>
        </div>
      ) : null}

      {application.review_note ? (
        <div className="mt-4 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm">
          <p className="text-xs font-medium text-[var(--text-muted)]">審査メモ</p>
          <p className="mt-1 whitespace-pre-wrap">{application.review_note}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadDetail}
          disabled={isPending}
          className="rounded-full border border-[var(--card-border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--gold)]"
        >
          {isPending ? "読込中..." : "本人確認書類・履歴を表示"}
        </button>
        {docUrl ? (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[rgba(197,160,89,0.12)] px-4 py-2 text-xs font-medium text-[var(--gold-dark)]"
          >
            本人確認書類を開く
          </a>
        ) : null}
      </div>

      {auditLog.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">操作履歴</p>
          <ul className="mt-2 space-y-2">
            {auditLog.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs"
              >
                <span className="font-medium">{entry.action}</span>
                {" · "}
                {formatAdminDate(entry.created_at)}
                {entry.admin_name ? ` · ${entry.admin_name}` : ""}
                {entry.note ? (
                  <p className="mt-1 whitespace-pre-wrap text-[var(--text-muted)]">
                    {entry.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReviewForm
          applicationId={application.id}
          action="approve"
          label="承認"
          confirmMessage={`${application.full_name} の申請を承認しますか？`}
          tone="gold"
        />
        <ReviewForm
          applicationId={application.id}
          action="resubmit_request"
          label="再提出依頼"
          confirmMessage="再提出を依頼しますか？"
        />
        <ReviewForm
          applicationId={application.id}
          action="reject"
          label="却下"
          confirmMessage="申請を却下しますか？"
          tone="danger"
        />
        <ReviewForm
          applicationId={application.id}
          action="suspend"
          label="利用停止"
          confirmMessage="アスリート機能を利用停止にしますか？"
          tone="danger"
        />
      </div>
    </div>
  );
}

export default function AdminAthleteApplications({
  applications,
  initialStatus,
  searchQuery,
}: AdminAthleteApplicationsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = applications.find((app) => app.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder="名前・メール・競技で検索"
          className="flex-1 rounded-xl border border-[var(--card-border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
        />
        <select
          name="status"
          defaultValue={initialStatus}
          className="rounded-xl border border-[var(--card-border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-gold rounded-full px-5 py-2.5 text-sm">
          検索
        </button>
      </form>

      {selected ? (
        <ApplicationDetail application={selected} onClose={() => setSelectedId(null)} />
      ) : null}

      <div className="premium-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">氏名</th>
              <th className="px-4 py-3 font-medium">メール</th>
              <th className="px-4 py-3 font-medium">競技</th>
              <th className="px-4 py-3 font-medium">ステータス</th>
              <th className="px-4 py-3 font-medium">申請日</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  該当する申請がありません
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-[var(--card-border)] last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{app.full_name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{app.user_email}</td>
                  <td className="px-4 py-3">{app.sport}</td>
                  <td className="px-4 py-3">
                    {ATHLETE_REVIEW_STATUS_LABELS[app.status]}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {formatAdminDate(app.submitted_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(app.id)}
                      className="rounded-full border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium hover:border-[var(--gold)]"
                    >
                      詳細・審査
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
