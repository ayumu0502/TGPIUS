import type { AccountType } from "@/types/auth";

export type FollowStats = {
  follower_count: number;
  following_count: number;
  is_following: boolean;
  is_followed_by: boolean;
  is_mutual: boolean;
};

export type FollowUserEntry = {
  id: string;
  name: string;
  sport: string;
  team: string;
  region: string;
  avatar_url: string | null;
  account_type: AccountType;
  followed_at: string;
  is_following: boolean;
  is_followed_by: boolean;
  is_mutual: boolean;
};

export type RecommendedAthlete = {
  id: string;
  name: string;
  sport: string;
  team: string;
  region: string;
  avatar_url: string | null;
  account_type: AccountType;
  follower_count: number;
  gift_total: number;
  is_following: boolean;
};

export type FollowActionState = {
  error?: string;
  isFollowing?: boolean;
  followerCount?: number;
};
