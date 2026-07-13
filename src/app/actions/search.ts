"use server";

import { createClient } from "@/lib/supabase/server";
import { mapAthlete, mapUser } from "@/lib/search/helpers";
import type {
  AthleteSearchResult,
  DiscoverySection,
  SearchFilterOptions,
  SearchFilters,
  SearchSort,
  SearchSuggestion,
  UserSearchResult,
} from "@/types/search";

export async function searchAthletes(
  filters: SearchFilters = {},
  limit = 24,
  offset = 0
): Promise<AthleteSearchResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_athletes", {
    p_query: filters.query?.trim() ?? "",
    p_sport: filters.sport?.trim() || null,
    p_region: filters.region?.trim() || null,
    p_gender: filters.gender?.trim() || null,
    p_min_followers: filters.minFollowers ?? null,
    p_sort: (filters.sort ?? "relevance") as SearchSort,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("searchAthletes:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapAthlete(row));
}

export async function searchUsers(
  query: string,
  limit = 8
): Promise<UserSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_users", {
    p_query: trimmed,
    p_limit: limit,
  });

  if (error) return [];
  return (data ?? []).map((row: Record<string, unknown>) => mapUser(row));
}

export async function getSearchSuggestions(
  query: string
): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const [athletes, users] = await Promise.all([
    searchAthletes({ query: trimmed, sort: "relevance" }, 6),
    searchUsers(trimmed, 4),
  ]);

  const athleteSuggestions: SearchSuggestion[] = athletes.map((a) => ({
    id: a.id,
    label: a.name,
    sublabel: [a.sport, a.region].filter(Boolean).join(" · ") || "アスリート",
    href: `/profile/${a.id}`,
    kind: "athlete",
  }));

  const userSuggestions: SearchSuggestion[] = users
    .filter((u) => u.account_type !== "athlete")
    .map((u) => ({
      id: u.id,
      label: u.name,
      sublabel: u.account_type === "fan" ? "ファン" : "スポンサー",
      href: `/profile/${u.id}`,
      kind: "user",
    }));

  return [...athleteSuggestions, ...userSuggestions].slice(0, 8);
}

export async function getDiscoveryAthletes(
  section: DiscoverySection,
  limit = 8
): Promise<AthleteSearchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_discovery_athletes", {
    p_section: section,
    p_limit: limit,
  });

  if (error) {
    console.error("getDiscoveryAthletes:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapAthlete(row));
}

export async function getSearchFilterOptions(): Promise<SearchFilterOptions> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_search_filter_options");

  if (error || !data) {
    return { sports: [], regions: [] };
  }

  const parsed = data as { sports?: string[]; regions?: string[] };
  return {
    sports: parsed.sports ?? [],
    regions: parsed.regions ?? [],
  };
}

export async function getAllDiscoverySections(): Promise<
  Record<DiscoverySection, AthleteSearchResult[]>
> {
  const sections: DiscoverySection[] = [
    "popular",
    "trending",
    "new",
    "recommended",
  ];

  const results = await Promise.all(
    sections.map((section) => getDiscoveryAthletes(section, 8))
  );

  return {
    popular: results[0] ?? [],
    trending: results[1] ?? [],
    new: results[2] ?? [],
    recommended: results[3] ?? [],
  };
}
