import type { AccountType } from "@/types/auth";

export type SearchSort = "relevance" | "followers" | "gifts" | "trending" | "newest";

export type DiscoverySection = "popular" | "new" | "recommended" | "trending";

export type AthleteSearchResult = {
  id: string;
  name: string;
  sport: string;
  team: string;
  region: string;
  gender: string;
  avatar_url: string | null;
  account_type: AccountType;
  follower_count: number;
  gift_total: number;
  recent_gift_total: number;
  post_count: number;
  created_at: string;
};

export type UserSearchResult = {
  id: string;
  name: string;
  sport: string;
  region: string;
  avatar_url: string | null;
  account_type: AccountType;
};

export type SearchFilters = {
  query?: string;
  sport?: string;
  region?: string;
  gender?: string;
  minFollowers?: number;
  sort?: SearchSort;
};

export type SearchFilterOptions = {
  sports: string[];
  regions: string[];
};

export type SearchSuggestion = {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  kind: "athlete" | "user";
};
