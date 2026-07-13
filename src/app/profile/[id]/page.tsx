import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getAthleteProfilePageData } from "@/app/actions/profile-page";
import { getRankingPreview } from "@/app/actions/rankings";
import { getUserPosts } from "@/app/actions/posts";
import { getPublicProfile } from "@/app/actions/profile";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { PremiumRightSidebar } from "@/components/layout/premium/PremiumWidgets";
import AthleteProfilePage from "@/components/profile/AthleteProfilePage";
import AthleteProfileSidebar from "@/components/profile/AthleteProfileSidebar";
import PremiumProfileView from "@/components/profile/PremiumProfileView";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import type { AccountType } from "@/types/auth";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  return {
    title: profile ? `${profile.name} | TGPLUS` : "プロフィール | TGPLUS",
    description: profile?.bio || `${profile?.name ?? ""}のプロフィール`,
  };
}

function canSendGift(
  currentType: AccountType,
  isOwnProfile: boolean,
  targetType: AccountType
) {
  return !isOwnProfile && currentType === "fan" && targetType === "athlete";
}

function canSendMessage(
  currentType: AccountType,
  isOwnProfile: boolean,
  targetType: AccountType
) {
  return (
    !isOwnProfile &&
    targetType === "athlete" &&
    (currentType === "fan" || currentType === "sponsor")
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const currentUser = await getCurrentProfile();
  if (!currentUser) redirect("/login");

  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const isOwnProfile = currentUser.id === id;
  const isAthlete = profile.account_type === "athlete";

  const [posts, layoutCounts, pageData, rankingAthletes] = await Promise.all([
    getUserPosts(id),
    getPremiumLayoutCounts(currentUser.account_type),
    isAthlete ? getAthleteProfilePageData(id) : Promise.resolve(null),
    isAthlete ? Promise.resolve([]) : getRankingPreview("gifts_month", 5),
  ]);

  const showGiftButton = canSendGift(
    currentUser.account_type,
    isOwnProfile,
    profile.account_type
  );
  const showMessageButton = canSendMessage(
    currentUser.account_type,
    isOwnProfile,
    profile.account_type
  );
  const showFollowButton =
    !isOwnProfile &&
    isAthlete &&
    (currentUser.account_type === "fan" || currentUser.account_type === "sponsor");
  const showPurchaseButton =
    currentUser.account_type === "fan" && !isOwnProfile && isAthlete;

  return (
    <PremiumLayout
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        accountType: currentUser.account_type,
        avatarUrl: undefined,
      }}
      activeNav={isOwnProfile ? "profile" : "athletes"}
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
      rightSidebar={
        isAthlete && pageData ? (
          <AthleteProfileSidebar profile={profile} pageData={pageData} />
        ) : (
          <PremiumRightSidebar rankingAthletes={rankingAthletes} />
        )
      }
    >
      {isAthlete && pageData ? (
        <AthleteProfilePage
          profile={profile}
          posts={posts}
          pageData={pageData}
          isOwnProfile={isOwnProfile}
          showGiftButton={showGiftButton}
          showMessageButton={showMessageButton}
          showFollowButton={showFollowButton}
          showPurchaseButton={showPurchaseButton}
        />
      ) : (
        <PremiumProfileView
          profile={profile}
          posts={posts}
          isOwnProfile={isOwnProfile}
          showGiftButton={showGiftButton}
          showMessageButton={showMessageButton}
        />
      )}
    </PremiumLayout>
  );
}
