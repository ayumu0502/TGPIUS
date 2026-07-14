import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import {
  getMyFollowingAthletes,
  getRecommendedAthletes,
  listFollowing,
} from "@/app/actions/follows";
import FollowList from "@/components/follows/FollowList";
import RecommendedAthletes from "@/components/follows/RecommendedAthletes";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "フォロー中",
  description: "フォロー中の選手・ユーザーを管理",
  path: "/following",
});

export default async function FollowingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [layoutCounts, following, followingAthletes, recommended] = await Promise.all([
    getPremiumLayoutCounts(profile.account_type),
    listFollowing(profile.id, 50, 0),
    getMyFollowingAthletes(12),
    getRecommendedAthletes(12),
  ]);

  const athleteFollowing = following.filter((entry) => entry.account_type === "athlete");

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="following"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">フォロー中</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {following.length}人をフォロー中
              {athleteFollowing.length > 0
                ? `（アスリート ${athleteFollowing.length}人）`
                : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/followers/${profile.id}`}
                className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]"
              >
                フォロワー一覧
              </Link>
              <Link
                href={`/profile/${profile.id}`}
                className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]"
              >
                マイプロフィール
              </Link>
            </div>
          </div>

          <FollowList
            title="フォロー中の選手"
            description="応援中のアスリート"
            users={followingAthletes}
            currentUserId={profile.id}
            emptyTitle="フォロー中の選手がいません"
            emptyDescription="検索やおすすめから推しの選手をフォローしましょう"
          />

          <FollowList
            title="すべてのフォロー"
            description="フォロー中のユーザー一覧"
            users={following}
            currentUserId={profile.id}
            emptyTitle="まだ誰もフォローしていません"
            emptyDescription="プロフィールや検索結果からフォローできます"
          />

          <RecommendedAthletes
            athletes={recommended}
            currentUserId={profile.id}
            title="おすすめ選手"
          />
        </div>
      </div>
    </PremiumLayout>
  );
}
