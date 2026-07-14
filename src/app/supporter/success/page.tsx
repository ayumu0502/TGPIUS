import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { ensureAccountType, ensureLoggedIn } from "@/lib/auth/page-guards";
import {
  createSupporterCheckout,
  createSupporterPortal,
  getSupporterBillingHistory,
  getSupporterStatus,
} from "@/app/actions/subscription";
import { fulfillSupporterCheckoutSession } from "@/lib/stripe/fulfill-subscription";
import { SUPPORTER_PLAN } from "@/lib/stripe/plans";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import SupporterBillingHistory from "@/components/subscription/SupporterBillingHistory";
import SupporterPlanCard from "@/components/subscription/SupporterPlanCard";
import { AuthAlert } from "@/components/auth/AuthInput";

export const metadata = createPrivatePageMetadata({
  title: "サポーター登録完了",
  description: "TGPLUSサポータープランへのご加入ありがとうございます",
  path: "/supporter/success",
});

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SupporterSuccessPage({ searchParams }: SuccessPageProps) {
  const profile = ensureLoggedIn(await getCurrentProfile());
  ensureAccountType(profile, "fan");

  const { session_id: sessionId } = await searchParams;
  let synced = false;
  let isActive = false;

  if (sessionId) {
    const result = await fulfillSupporterCheckoutSession(sessionId);
    synced = result.synced;
    isActive = result.isActive;
  }

  const status = await getSupporterStatus(profile.id);
  const billingHistory = await getSupporterBillingHistory(profile.id, 5);

  return (
    <div className="min-h-screen bg-[var(--surface)] px-6 py-16">
      <div className="mx-auto max-w-lg">
        <div className="premium-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(197,160,89,0.15)] text-2xl">
            ✓
          </div>
          <h1 className="ja-heading mt-6 text-2xl font-bold text-[var(--text-primary)]">
            サポーター登録ありがとうございます
          </h1>
          <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
            {SUPPORTER_PLAN.name}（{SUPPORTER_PLAN.priceLabel}）への加入を受け付けました。
          </p>

          {synced || isActive || status.subscription?.status === "active" ? (
            <div className="mt-4">
              <AuthAlert
                type="success"
                message="サポーター特典が有効になりました。限定コンテンツをお楽しみください。"
              />
            </div>
          ) : (
            <p className="ja-body mt-4 text-xs text-[var(--text-muted)]">
              反映まで数分かかる場合があります。
            </p>
          )}

          {status.subscription?.current_period_end ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              次回更新日:{" "}
              {new Date(status.subscription.current_period_end).toLocaleDateString("ja-JP")}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/fan/exclusive" className="btn-gold rounded-full px-6 py-3 text-sm">
              限定コンテンツを見る
            </Link>
            <Link
              href="/fan/dashboard"
              className="btn-gold-outline rounded-full px-6 py-3 text-sm"
            >
              ダッシュボードへ
            </Link>
          </div>
        </div>

        {billingHistory.length > 0 ? (
          <div className="premium-card mt-6 p-6">
            <SupporterBillingHistory records={billingHistory} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
