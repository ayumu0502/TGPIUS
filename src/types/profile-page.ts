import type { EventSummary } from "@/types/events";
import type { FanclubPost } from "@/types/fanclub";
import type { AthleteRankingEntry } from "@/types/rankings";

export type AthleteRecentGift = {
  id: string;
  amount: number;
  message: string;
  created_at: string;
  sender_name: string;
};

export type AthleteProfileStats = {
  follower_count: number;
  gift_total: number;
  monthly_gift_total: number;
  is_following: boolean;
  rank: number | null;
};

export type AthleteProfilePageData = {
  stats: AthleteProfileStats;
  recent_gifts: AthleteRecentGift[];
  events: EventSummary[];
  exclusive_posts: FanclubPost[];
  ranking_entries: AthleteRankingEntry[];
  has_fanclub: boolean;
};
