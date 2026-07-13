import Link from "next/link";
import FollowButton from "@/components/follows/FollowButton";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { formatFollowerCount } from "@/lib/search/constants";
import type { FollowUserEntry, RecommendedAthlete } from "@/types/follows";

type FollowUserCardProps = {
  user: FollowUserEntry | RecommendedAthlete;
  currentUserId: string;
  showFollowButton?: boolean;
  showMutualBadge?: boolean;
  compact?: boolean;
};

function isFollowUserEntry(
  user: FollowUserEntry | RecommendedAthlete
): user is FollowUserEntry {
  return "followed_at" in user;
}

export default function FollowUserCard({
  user,
  currentUserId,
  showFollowButton = true,
  showMutualBadge = true,
  compact = false,
}: FollowUserCardProps) {
  const isSelf = user.id === currentUserId;
  const isFollowing = user.is_following;
  const isMutual = isFollowUserEntry(user) ? user.is_mutual : false;
  const isFollowedBy = isFollowUserEntry(user) ? user.is_followed_by : false;

  return (
    <div
      className={`premium-card premium-card-hover flex items-center gap-3 p-4 ${
        compact ? "min-w-[280px] shrink-0" : ""
      }`}
    >
      <Link href={`/profile/${user.id}`} className="shrink-0">
        <ProfileAvatar name={user.name} avatarUrl={user.avatar_url} size="md" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/profile/${user.id}`}
            className="truncate font-semibold text-[var(--text-primary)] hover:text-[var(--gold-dark)]"
          >
            {user.name}
          </Link>
          {showMutualBadge && isMutual ? (
            <span className="badge-gold rounded-full px-2 py-0.5 text-[10px]">
              相互フォロー
            </span>
          ) : null}
          {showMutualBadge && !isMutual && isFollowedBy ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
              フォローされています
            </span>
          ) : null}
        </div>

        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
          {[user.sport, user.team, user.region].filter(Boolean).join(" · ") ||
            (user.account_type === "athlete" ? "アスリート" : "ユーザー")}
        </p>

        {"follower_count" in user ? (
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
            フォロワー {formatFollowerCount(user.follower_count)}
          </p>
        ) : null}
      </div>

      {showFollowButton && !isSelf ? (
        <FollowButton userId={user.id} initialIsFollowing={isFollowing} size="sm" />
      ) : null}
    </div>
  );
}
