import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { requireApprovedAthlete } from "@/app/actions/athlete-access";
import {
  getAthleteGiftStats,
  getReceivedGifts,
} from "@/app/actions/gifts";
import { listMyCreatedEvents } from "@/app/actions/events";
import AthleteDashboardContent from "@/components/dashboard/AthleteDashboardContent";
import AthleteEarningsPanel from "@/components/connect/AthleteEarningsPanel";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "アスリートダッシュボード",
  description: "活動発信、ギフト管理、売上・出金を一元管理。",
  path: "/athlete/dashboard",
});

export default async function AthleteDashboardPage() {
  const profile = await requireApprovedAthlete();

  const [stats, receivedGifts, createdEvents, layoutCounts, earningsRow] =
    await Promise.all([
    getAthleteGiftStats(),
    getReceivedGifts(),
    listMyCreatedEvents(6),
    getPremiumLayoutCounts(profile.account_type),
    createClient().then((sb) =>
      sb.from("profiles").select("earnings_balance").eq("id", profile.id).single()
    ),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
        avatarUrl: undefined,
      }}
      activeNav="dashboard"
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <AthleteDashboardContent
          totalReceived={stats.totalReceived}
          giftCount={stats.giftCount}
          recentGifts={receivedGifts.slice(0, 3)}
          createdEvents={createdEvents}
        />
        <div className="mt-8">
          <AthleteEarningsPanel
            earningsBalance={Number(earningsRow.data?.earnings_balance ?? 0)}
          />
        </div>
      </div>
    </PremiumLayout>
  );
}
