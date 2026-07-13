import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getRankingPreview } from "@/app/actions/rankings";
import { getFeedPosts } from "@/app/actions/posts";
import PremiumFeedContent from "@/components/feed/PremiumFeedContent";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { PremiumRightSidebar } from "@/components/layout/premium/PremiumWidgets";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = {
  title: "フィード | TGPLUS",
  description: "アスリートやファンの投稿をチェック",
};

export default async function FeedPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [posts, layoutCounts, rankingAthletes] = await Promise.all([
    getFeedPosts(),
    getPremiumLayoutCounts(profile.account_type),
    getRankingPreview("gifts_month", 5),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="feed"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
      rightSidebar={<PremiumRightSidebar rankingAthletes={rankingAthletes} />}
    >
      <PremiumFeedContent posts={posts} canCreatePost />
    </PremiumLayout>
  );
}
