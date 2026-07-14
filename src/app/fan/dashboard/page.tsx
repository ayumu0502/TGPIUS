import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { getCurrentProfile } from "@/app/actions/auth";
import { toPremiumCurrentUser } from "@/lib/auth/admin-access";
import { ensureAccountType, ensureLoggedIn } from "@/lib/auth/page-guards";
import {
  getFanGiftStats,
  getSentGifts,
  listAthletes,
} from "@/app/actions/gifts";
import { getMyFollowingAthletes } from "@/app/actions/follows";
import { getRankingPreview } from "@/app/actions/rankings";
import {
  getNextUpcomingEvent,
  listUpcomingEvents,
} from "@/app/actions/events";
import PremiumFanDashboard from "@/components/dashboard/PremiumFanDashboard";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { PremiumRightSidebar } from "@/components/layout/premium/PremiumWidgets";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "ファンダッシュボード",
  description: "推しのアスリートを応援し、ギフトやイベントに参加しましょう。",
  path: "/fan/dashboard",
});

export default async function FanDashboardPage() {
  const profile = ensureLoggedIn(await getCurrentProfile());
  ensureAccountType(profile, "fan");

  const [stats, sentGifts, athletes, followingAthletes, layoutCounts, rankingAthletes, nextEvent, upcomingEvents] =
    await Promise.all([
      getFanGiftStats(),
      getSentGifts(),
      listAthletes(),
      getMyFollowingAthletes(12),
      getPremiumLayoutCounts(profile.account_type),
      getRankingPreview("gifts_month", 5),
      getNextUpcomingEvent(),
      listUpcomingEvents(6),
    ]);

  return (
    <PremiumLayout
      currentUser={toPremiumCurrentUser(profile)}
      activeNav="dashboard"
      pointBalance={stats.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
      rightSidebar={<PremiumRightSidebar rankingAthletes={rankingAthletes} />}
    >
      <PremiumFanDashboard
        userName={profile.name}
        userId={profile.id}
        pointBalance={stats.pointBalance}
        giftCount={stats.giftCount}
        totalSent={stats.totalReceived}
        athletes={athletes}
        followingAthletes={followingAthletes}
        recentGifts={sentGifts.slice(0, 3)}
        rankingAthletes={rankingAthletes}
        nextEvent={nextEvent}
        upcomingEvents={upcomingEvents}
      />
    </PremiumLayout>
  );
}
