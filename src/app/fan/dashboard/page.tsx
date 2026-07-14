import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
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
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.account_type !== "fan") {
    redirect(`/${profile.account_type}/dashboard`);
  }

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
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
        avatarUrl: undefined,
      }}
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
