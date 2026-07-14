import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import {
  getAthleteGiftStats,
  getReceivedGifts,
} from "@/app/actions/gifts";
import { requireApprovedAthlete } from "@/app/actions/athlete-access";
import GiftHistoryList from "@/components/gifts/GiftHistoryList";
import { DashboardSection, SecondaryButton, StatCard } from "@/components/dashboard/DashboardUI";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import { formatPoints } from "@/lib/gifts/constants";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "ギフト受取履歴",
  description: "ファンから届いたギフトの履歴",
  path: "/athlete/gifts",
});

export default async function AthleteGiftsPage() {
  const profile = await requireApprovedAthlete();

  const [stats, receivedGifts, layoutCounts] = await Promise.all([
    getAthleteGiftStats(),
    getReceivedGifts(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="gifts"
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="受取合計"
            value={formatPoints(stats.totalReceived)}
            sub="累計ポイント（総額）"
            highlight
          />
          <StatCard
            label="確定売上"
            value={formatPoints(stats.pointBalance)}
            sub="手数料控除後・出金可能"
          />
          <StatCard
            label="受取回数"
            value={`${stats.giftCount}回`}
            sub="ファンからのギフト"
          />
        </div>

        <DashboardSection
          title="ギフト受取履歴"
          description="ファンから届いた応援ギフト"
          action={
            <Link href="/athlete/dashboard">
              <SecondaryButton>ダッシュボード</SecondaryButton>
            </Link>
          }
        >
          <GiftHistoryList
            gifts={receivedGifts}
            mode="received"
            emptyMessage="まだギフトは届いていません"
            variant="light"
          />
        </DashboardSection>
      </div>
    </PremiumLayout>
  );
}
