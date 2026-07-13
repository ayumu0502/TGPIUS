"use client";

import { useTransition } from "react";
import { SUPPORTER_PLAN } from "@/lib/stripe/plans";
import type { SubscriptionState } from "@/types/subscription";

type SupporterPlanCardProps = {
  isLoggedIn: boolean;
  isFan: boolean;
  isActive: boolean;
  periodEnd: string | null;
  createCheckout: () => Promise<SubscriptionState>;
  createPortal: () => Promise<SubscriptionState>;
};

export default function SupporterPlanCard({
  isLoggedIn,
  isFan,
  isActive,
  periodEnd,
  createCheckout,
  createPortal,
}: SupporterPlanCardProps) {
  const [pending, startTransition] = useTransition();

  const handleSubscribe = () => {
    startTransition(async () => {
      await createCheckout();
    });
  };

  const handlePortal = () => {
    startTransition(async () => {
      await createPortal();
    });
  };

  return (
    <div className="premium-card mt-10 overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] bg-gradient-to-br from-[rgba(197,160,89,0.12)] to-white px-6 py-8 sm:px-8">
        <p className="text-4xl font-bold text-[var(--text-primary)]">
          {SUPPORTER_PLAN.priceLabel}
        </p>
        {isActive && periodEnd ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            次回更新: {new Date(periodEnd).toLocaleDateString("ja-JP")}
          </p>
        ) : null}
      </div>

      <ul className="space-y-3 px-6 py-8 sm:px-8">
        {SUPPORTER_PLAN.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(197,160,89,0.15)] text-xs text-[var(--gold-dark)]">
              ✓
            </span>
            {benefit}
          </li>
        ))}
      </ul>

      <div className="border-t border-[var(--card-border)] px-6 py-6 sm:px-8">
        {!isLoggedIn ? (
          <p className="text-center text-sm text-[var(--text-muted)]">ログイン後に加入できます</p>
        ) : !isFan ? (
          <p className="text-center text-sm text-[var(--text-muted)]">
            ファンアカウントのみ加入可能です
          </p>
        ) : isActive ? (
          <button
            type="button"
            onClick={handlePortal}
            disabled={pending}
            className="btn-gold-outline w-full rounded-full py-3.5 text-sm disabled:opacity-50"
          >
            {pending ? "読み込み中..." : "プラン管理・解約（Stripe）"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={pending}
            className="btn-gold w-full rounded-full py-3.5 text-sm disabled:opacity-50"
          >
            {pending ? "Stripeへ移動中..." : "サポーターになる"}
          </button>
        )}
        <p className="ja-body mt-4 text-center text-xs text-[var(--text-muted)]">
          決済はStripe Checkoutで安全に処理されます（Visa / Mastercard / JCB / AMEX / Apple Pay / Google Pay）
        </p>
      </div>
    </div>
  );
}
