"use client";

import { useState } from "react";
import AthleteProfileActions from "@/components/profile/AthleteProfileActions";
import AthleteProfileHeader from "@/components/profile/AthleteProfileHeader";
import {
  AthleteProfileEventsTab,
  AthleteProfileExclusiveTab,
  AthleteProfileGalleryTab,
  AthleteProfileHomeTab,
  AthleteProfilePostsTab,
  AthleteProfileRankingTab,
  PROFILE_TABS,
  type ProfileTabId,
} from "@/components/profile/AthleteProfileTabs";
import type { PostWithMeta } from "@/types/posts";
import type { PublicProfile } from "@/types/profile";
import type { AthleteProfilePageData } from "@/types/profile-page";

type AthleteProfilePageProps = {
  profile: PublicProfile;
  posts: PostWithMeta[];
  pageData: AthleteProfilePageData;
  isOwnProfile: boolean;
  showGiftButton: boolean;
  showMessageButton: boolean;
  showFollowButton: boolean;
  showPurchaseButton: boolean;
};

export default function AthleteProfilePage({
  profile,
  posts,
  pageData,
  isOwnProfile,
  showGiftButton,
  showMessageButton,
  showFollowButton,
  showPurchaseButton,
}: AthleteProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("home");
  const [followerCount, setFollowerCount] = useState(pageData.stats.follower_count);
  const [isFollowing, setIsFollowing] = useState(pageData.stats.is_following);

  const handleFollowChange = (state: {
    isFollowing: boolean;
    followerCount?: number;
  }) => {
    setIsFollowing(state.isFollowing);
    if (state.followerCount !== undefined) {
      setFollowerCount(state.followerCount);
    } else {
      setFollowerCount((count) => count + (state.isFollowing ? 1 : -1));
    }
  };

  return (
    <div className="min-h-full bg-[#f7f8fa]">
      <AthleteProfileHeader
        profile={profile}
        stats={pageData.stats}
        followerCount={followerCount}
      />

      <AthleteProfileActions
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        showGiftButton={showGiftButton}
        showMessageButton={showMessageButton}
        showFollowButton={showFollowButton}
        showPurchaseButton={showPurchaseButton}
        onFollowChange={handleFollowChange}
      />

      <div className="border-b border-[var(--card-border)] bg-white">
        <div className="mx-auto max-w-5xl overflow-x-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex min-w-max gap-1 py-1" aria-label="プロフィールタブ">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[var(--gold)] text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="premium-content min-h-[50vh] py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {activeTab === "home" ? (
            <AthleteProfileHomeTab
              profile={profile}
              pageData={pageData}
              posts={posts}
              isOwnProfile={isOwnProfile}
            />
          ) : null}
          {activeTab === "posts" ? (
            <AthleteProfilePostsTab posts={posts} isOwnProfile={isOwnProfile} />
          ) : null}
          {activeTab === "exclusive" ? (
            <AthleteProfileExclusiveTab
              athleteId={profile.id}
              posts={pageData.exclusive_posts}
              hasFanclub={pageData.has_fanclub}
            />
          ) : null}
          {activeTab === "events" ? (
            <AthleteProfileEventsTab events={pageData.events} athleteId={profile.id} />
          ) : null}
          {activeTab === "ranking" ? (
            <AthleteProfileRankingTab
              entries={pageData.ranking_entries}
              athleteId={profile.id}
            />
          ) : null}
          {activeTab === "gallery" ? (
            <AthleteProfileGalleryTab posts={posts} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
