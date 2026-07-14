"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  cancelAthleteInvite,
  resendAthleteInvite,
} from "@/app/actions/admin-athletes";
import { AuthAlert } from "@/components/auth/AuthInput";
import {
  ATHLETE_INVITE_STATUS_LABELS,
  getRegistrationStatusLabel,
  type AdminAthleteFormState,
  type ProvisionalAthleteProfile,
} from "@/types/athlete-invite";
import { ATHLETE_REVIEW_STATUS_LABELS } from "@/types/athlete-application";

type AdminAthleteListProps = {
  athletes: ProvisionalAthleteProfile[];
};

export default function AdminAthleteList({ athletes }: AdminAthleteListProps) {
  const [resendState, resendAction, resendPending] = useActionState(
    resendAthleteInvite,
    null
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelAthleteInvite,
    null
  );

  const actionState = (resendState ?? cancelState) as AdminAthleteFormState | null;

  return (
    <div className="space-y-4">
      {actionState?.error ? <AuthAlert type="error" message={actionState.error} /> : null}
      {actionState?.success ? <AuthAlert type="success" message={actionState.success} /> : null}
      {actionState?.inviteUrl ? (
        <div className="rounded-xl border border-[rgba(197,160,89,0.3)] bg-[rgba(197,160,89,0.08)] px-4 py-3 text-sm">
          <p className="font-medium text-[var(--gold-dark)]">招待URL</p>
          <p className="mt-1 break-all">{actionState.inviteUrl}</p>
        </div>
      ) : null}

      {athletes.length === 0 ? (
        <div className="premium-card p-8 text-center text-sm text-[var(--text-muted)]">
          仮登録のアスリートはまだありません
        </div>
      ) : (
        athletes.map((athlete) => (
          <article key={athlete.id} className="premium-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {athlete.full_name}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{athlete.email}</p>
                <p className="mt-2 text-sm">
                  {athlete.sport}
                  {athlete.team ? ` / ${athlete.team}` : ""}
                  {athlete.region ? ` / ${athlete.region}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>
                    登録:{" "}
                    {getRegistrationStatusLabel(
                      athlete.invite_status,
                      athlete.linked_user_id
                    )}
                  </Badge>
                  <Badge>
                    招待:{" "}
                    {athlete.invite_status
                      ? ATHLETE_INVITE_STATUS_LABELS[athlete.invite_status]
                      : "—"}
                  </Badge>
                  <Badge>
                    審査: {ATHLETE_REVIEW_STATUS_LABELS[athlete.review_status]}
                  </Badge>
                  <Badge>{athlete.is_public ? "公開下書き" : "非公開下書き"}</Badge>
                </div>
                {athlete.invite_expires_at ? (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    招待期限: {new Date(athlete.invite_expires_at).toLocaleString("ja-JP")}
                  </p>
                ) : null}
                {athlete.organization_name ? (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    所属: {athlete.organization_name}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {athlete.linked_user_id ? (
                  <Link
                    href={`/profile/${athlete.linked_user_id}`}
                    className="rounded-full border border-[var(--card-border)] px-4 py-2 text-xs font-medium hover:border-[var(--gold)]"
                  >
                    プロフィール
                  </Link>
                ) : (
                  <>
                    <form action={resendAction}>
                      <input type="hidden" name="provisional_id" value={athlete.id} />
                      <button
                        type="submit"
                        disabled={resendPending || cancelPending}
                        className="rounded-full border border-[var(--gold)] px-4 py-2 text-xs font-medium text-[var(--gold-dark)]"
                      >
                        再送信
                      </button>
                    </form>
                    <form action={cancelAction}>
                      <input type="hidden" name="provisional_id" value={athlete.id} />
                      <button
                        type="submit"
                        disabled={resendPending || cancelPending}
                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600"
                      >
                        取消
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="badge-gold rounded-full px-3 py-1 text-xs font-medium">{children}</span>
  );
}
