"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { approvePayoutRequest, rejectPayoutRequest } from "@/app/actions/payout";
import { formatPoints } from "@/lib/points/constants";
import type { PayoutRequest } from "@/types/subscription";

type AdminPayoutPanelProps = {
  requests: PayoutRequest[];
};

export default function AdminPayoutPanel({ requests }: AdminPayoutPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      await approvePayoutRequest(id);
      router.refresh();
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      await rejectPayoutRequest(id);
      router.refresh();
    });
  };

  return (
    <section className="premium-card p-6">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">出金申請</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        アスリートへの銀行振込承認（売上はTGPLUS運営のStripe口座で受領）
      </p>

      {requests.length === 0 ? (
        <p className="ja-body mt-6 text-sm text-[var(--text-muted)]">
          保留中の出金申請はありません
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {requests.map((req) => (
            <li
              key={req.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--card-border)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-[var(--text-primary)]">
                  {req.athlete_name ?? "アスリート"} · {formatPoints(req.amount)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(req.created_at).toLocaleString("ja-JP")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleApprove(req.id)}
                  className="btn-gold rounded-full px-4 py-2 text-xs disabled:opacity-50"
                >
                  承認（振込済み）
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleReject(req.id)}
                  className="btn-gold-outline rounded-full px-4 py-2 text-xs disabled:opacity-50"
                >
                  却下
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
