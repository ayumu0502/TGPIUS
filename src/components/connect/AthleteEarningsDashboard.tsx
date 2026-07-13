"use client";

import { useActionState } from "react";
import { requestPayout } from "@/app/actions/payout";
import { formatPoints } from "@/lib/points/constants";
import type { AthleteEarningsSummary, PayoutRequest } from "@/types/subscription";

type AthleteEarningsDashboardProps = {
  summary: AthleteEarningsSummary;
  payouts: PayoutRequest[];
};

function payoutStatusLabel(status: PayoutRequest["status"]): string {
  switch (status) {
    case "pending":
      return "申請中";
    case "approved":
      return "承認済";
    case "processing":
      return "処理中";
    case "completed":
      return "振込完了";
    case "rejected":
      return "却下";
    default:
      return status;
  }
}

export default function AthleteEarningsDashboard({
  summary,
  payouts,
}: AthleteEarningsDashboardProps) {
  const [state, formAction, pending] = useActionState(requestPayout, null);

  const unsettled = Math.max(
    0,
    summary.totalEarnings - summary.settledPayout - summary.availableBalance
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label="ギフト売上（総額）" value={formatPoints(summary.giftGross)} sub={`${summary.giftCount}件`} />
        <StatBox label="ギフト売上（手取り）" value={formatPoints(summary.giftNet)} sub="手数料控除後" />
        <StatBox label="サブスク売上" value={formatPoints(summary.subscriptionNet)} sub="分配対象外" />
        <StatBox label="総売上" value={formatPoints(summary.totalEarnings)} highlight />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox label="確定売上（出金可能）" value={formatPoints(summary.availableBalance)} highlight />
        <StatBox label="未確定売上" value={formatPoints(unsettled)} sub="処理・保留中" />
        <StatBox label="出金済み" value={formatPoints(summary.settledPayout)} />
      </div>

      <section className="premium-card p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">出金申請</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          確定売上から出金できます（最低1,000ポイント）。運営が銀行振込でお支払いします。
        </p>

        <form action={formAction} className="mt-6 space-y-3">
          <input
            type="number"
            name="amount"
            min={1000}
            step={100}
            placeholder="出金額（最低1,000ポイント）"
            className="w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={pending || summary.availableBalance < 1000}
            className="btn-gold-outline w-full rounded-full py-3 text-sm disabled:opacity-50"
          >
            {pending ? "申請中..." : "出金を申請"}
          </button>
        </form>

        {state?.error ? <p className="mt-3 text-sm text-red-500">{state.error}</p> : null}
        {state?.success ? <p className="mt-3 text-sm text-green-600">{state.success}</p> : null}
      </section>

      <section className="premium-card p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">出金履歴</h2>
        {payouts.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">出金履歴はまだありません。</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--card-border)]">
            {payouts.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {formatPoints(payout.amount)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {new Date(payout.created_at).toLocaleDateString("ja-JP")} ·{" "}
                    {payoutStatusLabel(payout.status)}
                  </p>
                  {payout.admin_note ? (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{payout.admin_note}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="premium-card p-4">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${highlight ? "text-[var(--gold-dark)]" : "text-[var(--text-primary)]"}`}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-[var(--text-muted)]">{sub}</p> : null}
    </div>
  );
}
