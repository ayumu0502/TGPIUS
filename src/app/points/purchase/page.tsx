import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getPointBalance } from "@/app/actions/gifts";
import { getPurchaseHistory } from "@/app/actions/points";
import { DashboardSection, StatCard } from "@/components/dashboard/DashboardUI";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import PointPurchaseForm from "@/components/points/PointPurchaseForm";
import PointTransactionHistory from "@/components/points/PointTransactionHistory";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import { getStripeCheckoutStatus } from "@/lib/stripe/config";
import { formatPoints } from "@/lib/points/constants";

export const metadata: Metadata = {
  title: "ポイント購入 | TGPLUS",
  description: "ギフト送信に使えるポイントを購入",
};

export default async function PointPurchasePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "fan") {
    redirect(`/${profile.account_type}/dashboard`);
  }

  const [pointBalance, transactions, layoutCounts] = await Promise.all([
    getPointBalance(),
    getPurchaseHistory(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  const totalPurchased = transactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  const stripeStatus = getStripeCheckoutStatus();

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="points"
      pointBalance={pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8">
        <div className="mb-2">
          <Link
            href="/fan/dashboard"
            className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--gold-dark)]"
          >
            ← ファンダッシュボードに戻る
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="ポイント残高"
            value={formatPoints(pointBalance)}
            sub="現在の残高"
            highlight
          />
          <StatCard
            label="購入回数"
            value={`${transactions.length}回`}
            sub="これまでの購入"
          />
          <StatCard
            label="購入合計"
            value={formatPoints(totalPurchased)}
            sub="累計ポイント"
          />
        </div>

        <div className="mx-auto max-w-2xl">
          <PointPurchaseForm
            pointBalance={pointBalance}
            testPurchaseEnabled={
              process.env.ENABLE_TEST_POINT_PURCHASE === "true"
            }
            stripeCheckoutReady={stripeStatus.ready}
            stripeSetupMessage={stripeStatus.message}
            stripeMode={stripeStatus.mode}
          />
        </div>

        <DashboardSection
          title="購入履歴"
          description="これまで購入したポイント"
        >
          <PointTransactionHistory transactions={transactions} />
        </DashboardSection>
      </div>
    </PremiumLayout>
  );
}
