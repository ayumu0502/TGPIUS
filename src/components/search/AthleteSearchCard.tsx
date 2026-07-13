"use client";

import Link from "next/link";
import FollowButton from "@/components/follows/FollowButton";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import {
  formatFollowerCount,
  formatGiftTotal,
} from "@/lib/search/constants";
import type { AthleteSearchResult } from "@/types/search";

type AthleteSearchCardProps = {
  athlete: AthleteSearchResult;
  compact?: boolean;
  isFollowing?: boolean;
  showFollowButton?: boolean;
  currentUserId?: string;
};

export default function AthleteSearchCard({
  athlete,
  compact = false,
  isFollowing = false,
  showFollowButton = false,
  currentUserId,
}: AthleteSearchCardProps) {
  const isSelf = currentUserId === athlete.id;

  return (
    <div
      className={`premium-card premium-card-hover flex gap-3 p-4 ${
        compact ? "min-w-[260px] shrink-0" : ""
      }`}
    >
      <Link href={`/profile/${athlete.id}`} className="shrink-0">
        <ProfileAvatar
          name={athlete.name}
          avatarUrl={athlete.avatar_url}
          size={compact ? "sm" : "md"}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${athlete.id}`}
          className="truncate font-semibold text-[var(--text-primary)] hover:text-[var(--gold-dark)]"
        >
          {athlete.name}
        </Link>
        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
          {[athlete.sport, athlete.team, athlete.region]
            .filter(Boolean)
            .join(" · ") || "競技未設定"}
        </p>
        {!compact ? (
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[var(--text-secondary)]">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5">
              フォロワー {formatFollowerCount(athlete.follower_count)}
            </span>
            <span className="rounded-full bg-[var(--gold)]/10 px-2 py-0.5 text-[var(--gold-dark)]">
              ギフト {formatGiftTotal(athlete.gift_total)}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-[10px] text-[var(--gold-dark)]">
            {formatGiftTotal(athlete.gift_total)}
          </p>
        )}
      </div>

      {showFollowButton && !isSelf ? (
        <FollowButton userId={athlete.id} initialIsFollowing={isFollowing} size="sm" />
      ) : null}
    </div>
  );
}
