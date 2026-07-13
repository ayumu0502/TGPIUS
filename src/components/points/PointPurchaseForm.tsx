"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { purchasePoints } from "@/app/actions/points";
import { createCheckoutSession } from "@/app/actions/stripe";
import { AuthAlert } from "@/components/auth/AuthInput";
import PointPlanSelector from "@/components/points/PointPlanSelector";
import { formatPoints } from "@/lib/points/constants";
import type { PurchaseAmount } from "@/types/points";

type PointPurchaseFormProps = {
  pointBalance: number;
  testPurchaseEnabled?: boolean;
  stripeCheckoutReady?: boolean;
  stripeSetupMessage?: string | null;
  stripeMode?: "test" | "live" | "unset";
};

export default function PointPurchaseForm({
  pointBalance,
  testPurchaseEnabled = false,
  stripeCheckoutReady = false,
  stripeSetupMessage = null,
  stripeMode = "unset",
}: PointPurchaseFormProps) {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<PurchaseAmount | null>(
    null
  );
  const [testState, testAction, isTestPending] = useActionState(
    purchasePoints,
    null
  );
  const [checkoutState, checkoutAction, isCheckoutPending] = useActionState(
    createCheckoutSession,
    null
  );

  const isPending = isTestPending || isCheckoutPending;
  const state = checkoutState?.error || checkoutState?.fieldErrors
    ? checkoutState
    : testState;

  useEffect(() => {
    if (testState?.success) {
      router.refresh();
      setSelectedAmount(null);
    }
  }, [testState, router]);

  return (
    <div className="premium-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">ポイント購入</h2>
      <p className="ja-body mt-2 text-sm text-[var(--text-muted)]">
        Stripe Checkout で安全にポイントを購入できます
        {stripeMode === "test" ? "（テストモード）" : null}
      </p>

      {!stripeCheckoutReady && stripeSetupMessage ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Stripe 決済の準備ができていません</p>
          <p className="ja-body mt-1 text-xs leading-relaxed">{stripeSetupMessage}</p>
          <ul className="ja-body mt-2 list-inside list-disc text-xs text-amber-800/90">
            <li>.env.local に STRIPE_SECRET_KEY（sk_test_ で始まる実際のキー）を設定</li>
            <li>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY（pk_test_ で始まる実際のキー）を設定</li>
            <li>設定後にサーバーを再起動（npm run dev）</li>
            <li>初回のみ Supabase で stripe-checkout-user-rpc.sql を実行、または SUPABASE_SERVICE_ROLE_KEY（sb_secret_...）を設定</li>
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4">
        <p className="text-xs text-[var(--text-muted)]">現在のポイント残高</p>
        <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{formatPoints(pointBalance)}</p>
        <p className="ja-body mt-1 text-xs text-[var(--text-muted)]">
          ギフト送信・応援に利用できます（決済画面のみ円表示）
        </p>
      </div>

      {state?.error ? (
        <div className="mt-4">
          <AuthAlert type="error" message={state.error} />
        </div>
      ) : null}

      {testState?.success ? (
        <div className="mt-4">
          <AuthAlert type="success" message={testState.success} />
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        <PointPlanSelector
          name="amount_display"
          selected={selectedAmount}
          onChange={setSelectedAmount}
          disabled={isPending}
          error={state?.fieldErrors?.amount}
        />

        <form action={checkoutAction}>
          <input type="hidden" name="amount" value={selectedAmount ?? ""} />
          <button
            type="submit"
            disabled={isPending || !selectedAmount || !stripeCheckoutReady}
            className="btn-gold w-full rounded-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCheckoutPending
              ? "Stripeへ移動中..."
              : stripeCheckoutReady
                ? "Stripeで購入する"
                : "Stripe未設定のため購入できません"}
          </button>
        </form>

        {testPurchaseEnabled ? (
          <form action={testAction}>
            <input type="hidden" name="amount" value={selectedAmount ?? ""} />
            <button
              type="submit"
              disabled={isPending || !selectedAmount}
              className="btn-gold-outline w-full rounded-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isTestPending ? "購入処理中..." : "テスト購入（開発用）"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
