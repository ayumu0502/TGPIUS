import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAthleteGiftStats,
  getReceivedGifts,
} from "@/app/actions/gifts";
import { getCurrentProfile } from "@/app/actions/auth";
import GiftHistoryList from "@/components/gifts/GiftHistoryList";
import { DashboardSection, SecondaryButton, StatCard } from "@/components/dashboard/DashboardUI";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import { formatPoints } from "@/lib/gifts/constants";

export const metadata: Metadata = {
  title: "ギフト受取履歴 | TGPLUS",
  description: "ファンから届いたギフトの履歴",
};

export default async function AthleteGiftsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "athlete") {
    redirect(`/${profile.account_type}/dashboard`);
  }

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
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="受取合計"
            value={formatPoints(stats.totalReceived)}
            sub="累計ポイント"
            highlight
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
