import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getFollowStats, getRecommendedAthletes, listFollowers } from "@/app/actions/follows";
import { getPublicProfile } from "@/app/actions/profile";
import FollowList from "@/components/follows/FollowList";
import RecommendedAthletes from "@/components/follows/RecommendedAthletes";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

type FollowersPageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({
  params,
}: FollowersPageProps): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getPublicProfile(userId);
  return {
    title: profile ? `${profile.name}のフォロワー | TGPLUS` : "フォロワー | TGPLUS",
  };
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const currentUser = await getCurrentProfile();
  if (!currentUser) redirect("/login");

  const { userId } = await params;
  const profile = await getPublicProfile(userId);
  if (!profile) notFound();

  const [layoutCounts, followers, stats, recommended] = await Promise.all([
    getPremiumLayoutCounts(currentUser.account_type),
    listFollowers(userId, 50, 0),
    getFollowStats(userId),
    getRecommendedAthletes(8),
  ]);

  const isOwnProfile = currentUser.id === userId;
  const mutualCount = followers.filter((entry) => entry.is_mutual).length;

  return (
    <PremiumLayout
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        accountType: currentUser.account_type,
      }}
      activeNav={isOwnProfile ? "profile" : "athletes"}
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="premium-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar
                name={profile.name}
                avatarUrl={profile.avatar_url}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${profile.id}`}
                  className="text-xl font-bold text-[var(--text-primary)] hover:text-[var(--gold-dark)]"
                >
                  {profile.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {profile.sport || profile.account_type === "athlete" ? profile.sport : "ユーザー"}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span className="font-semibold text-[var(--text-primary)]">
                    フォロワー {stats.follower_count.toLocaleString("ja-JP")}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    フォロー中 {stats.following_count.toLocaleString("ja-JP")}
                  </span>
                  {mutualCount > 0 ? (
                    <span className="badge-gold rounded-full px-2 py-0.5 text-xs">
                      相互フォロー {mutualCount}人
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {isOwnProfile ? (
                  <Link href="/following" className="btn-gold rounded-full px-4 py-2 text-sm">
                    フォロー中一覧
                  </Link>
                ) : (
                  <Link
                    href={`/profile/${profile.id}`}
                    className="btn-gold-outline rounded-full px-4 py-2 text-sm"
                  >
                    プロフィールを見る
                  </Link>
                )}
              </div>
            </div>
          </div>

          <FollowList
            title="フォロワー"
            description={
              isOwnProfile
                ? "あなたをフォローしているユーザー"
                : `${profile.name}さんのフォロワー`
            }
            users={followers}
            currentUserId={currentUser.id}
            emptyTitle="フォロワーがいません"
            emptyDescription="プロフィールを充実させて、最初のフォロワーを獲得しましょう"
          />

          {!isOwnProfile && recommended.length > 0 ? (
            <RecommendedAthletes
              athletes={recommended}
              currentUserId={currentUser.id}
              title="おすすめ選手"
            />
          ) : null}
        </div>
      </div>
    </PremiumLayout>
  );
}
