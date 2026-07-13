import type {
  FollowStats,
  FollowUserEntry,
  RecommendedAthlete,
} from "@/types/follows";

export function mapFollowStats(raw: unknown): FollowStats {
  if (!raw || typeof raw !== "object") {
    return {
      follower_count: 0,
      following_count: 0,
      is_following: false,
      is_followed_by: false,
      is_mutual: false,
    };
  }

  const data = raw as Record<string, unknown>;
  return {
    follower_count: Number(data.follower_count ?? 0),
    following_count: Number(data.following_count ?? 0),
    is_following: Boolean(data.is_following),
    is_followed_by: Boolean(data.is_followed_by),
    is_mutual: Boolean(data.is_mutual),
  };
}

export function mapFollowUserEntry(row: Record<string, unknown>): FollowUserEntry {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    sport: String(row.sport ?? ""),
    team: String(row.team ?? ""),
    region: String(row.region ?? ""),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    account_type: row.account_type as FollowUserEntry["account_type"],
    followed_at: String(row.followed_at ?? ""),
    is_following: Boolean(row.is_following),
    is_followed_by: Boolean(row.is_followed_by),
    is_mutual: Boolean(row.is_mutual),
  };
}

export function mapRecommendedAthlete(row: Record<string, unknown>): RecommendedAthlete {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    sport: String(row.sport ?? ""),
    team: String(row.team ?? ""),
    region: String(row.region ?? ""),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    account_type: row.account_type as RecommendedAthlete["account_type"],
    follower_count: Number(row.follower_count ?? 0),
    gift_total: Number(row.gift_total ?? 0),
    is_following: Boolean(row.is_following),
  };
}
