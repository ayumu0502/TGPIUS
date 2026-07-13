"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPayout } from "@/app/actions/payout";
import { formatPoints } from "@/lib/points/constants";

type AthleteEarningsPanelProps = {
  earningsBalance: number;
};

export default function AthleteEarningsPanel({
  earningsBalance,
}: AthleteEarningsPanelProps) {
  const [state, formAction, pending] = useActionState(requestPayout, null);

  return (
    <section className="premium-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">売上・出金</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            ギフト売上（手数料控除後）の出金管理
          </p>
        </div>
        <Link
          href="/athlete/earnings"
          className="shrink-0 text-sm font-semibold text-[var(--gold-dark)] hover:underline"
        >
          詳細 →
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4">
        <p className="text-xs text-[var(--text-muted)]">出金可能残高</p>
        <p className="mt-1 text-2xl font-bold text-[var(--gold-dark)]">
          {formatPoints(earningsBalance)}
        </p>
      </div>

      <p className="ja-body mt-4 text-xs text-[var(--text-muted)]">
        出金は運営が銀行振込で処理します（Stripe Connect は使用しません）。
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
          disabled={pending || earningsBalance < 1000}
          className="btn-gold-outline w-full rounded-full py-3 text-sm disabled:opacity-50"
        >
          {pending ? "申請中..." : "出金を申請"}
        </button>
      </form>

      {state?.error ? <p className="mt-3 text-sm text-red-500">{state.error}</p> : null}
      {state?.success ? <p className="mt-3 text-sm text-green-600">{state.success}</p> : null}
    </section>
  );
}
