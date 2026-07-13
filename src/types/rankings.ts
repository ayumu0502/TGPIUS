export type RankingCategory =
  | "overall"
  | "gifts_month"
  | "gifts_week"
  | "followers"
  | "likes"
  | "trending";

export type RankingPeriod = "day" | "week" | "month" | "all";

export type AthleteRankingEntry = {
  rank: number;
  id: string;
  name: string;
  sport: string;
  team: string;
  region: string;
  avatar_url: string | null;
  score: number;
  gift_score: number;
  follower_score: number;
  like_score: number;
};

export type RankingFilters = {
  category?: RankingCategory;
  period?: RankingPeriod;
  sport?: string;
  region?: string;
};

export type RankingFilterOptions = {
  sports: string[];
  regions: string[];
};

export type RankingPreviewAthlete = {
  id: string;
  name: string;
  sport: string;
  avatarUrl: string | null;
  score: number;
  rank: number;
};
