import Link from "next/link";
import { createSupporterCheckout, createSupporterPortal, getSupporterBillingHistory, getSupporterStatus } from "@/app/actions/subscription";
import { getCurrentProfile } from "@/app/actions/auth";
import { SUPPORTER_PLAN } from "@/lib/stripe/plans";
import { createPageMetadata } from "@/lib/seo/metadata";
import SupporterBillingHistory from "@/components/subscription/SupporterBillingHistory";
import SupporterPlanCard from "@/components/subscription/SupporterPlanCard";

export const metadata = createPageMetadata({
  title: "TGPLUSサポーター",
  description: "月額1,000円で限定コンテンツ・イベント・バッジが使えるTGPLUSサポータープラン",
  path: "/supporter",
});

export default async function SupporterPage() {
  const profile = await getCurrentProfile();
  const status = profile ? await getSupporterStatus(profile.id) : null;
  const billingHistory =
    profile?.account_type === "fan"
      ? await getSupporterBillingHistory(profile.id, 10)
      : [];
  const isActive =
    status?.subscription?.status === "active" ||
    status?.subscription?.status === "trialing";

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold-dark)]">
          TGPLUS Supporter
        </p>
        <h1 className="ja-heading mt-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          {SUPPORTER_PLAN.name}
        </h1>
        <p className="ja-body mt-4 text-[var(--text-muted)]">
          プラットフォーム全体の限定特典を楽しめる、唯一のサブスクリプションプランです。
        </p>

        <SupporterPlanCard
          isLoggedIn={Boolean(profile)}
          isFan={profile?.account_type === "fan"}
          isActive={isActive}
          periodEnd={status?.subscription?.current_period_end ?? null}
          createCheckout={createSupporterCheckout}
          createPortal={createSupporterPortal}
        />

        {isActive && profile?.account_type === "fan" ? (
          <div className="premium-card mt-8 p-6">
            <SupporterBillingHistory records={billingHistory} />
          </div>
        ) : null}

        {isActive ? (
          <p className="ja-body mt-6 text-center text-sm">
            <Link href="/fan/exclusive" className="font-semibold text-[var(--gold-dark)] hover:underline">
              限定コンテンツを見る
            </Link>
          </p>
        ) : null}

        {!profile ? (
          <p className="ja-body mt-8 text-center text-sm text-[var(--text-muted)]">
            <Link href="/login" className="font-semibold text-[var(--gold-dark)] hover:underline">
              ログイン
            </Link>
            または
            <Link href="/register" className="font-semibold text-[var(--gold-dark)] hover:underline">
              無料登録
            </Link>
            して加入できます
          </p>
        ) : null}
      </div>
    </div>
  );
}
