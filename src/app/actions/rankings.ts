"use server";

import { createClient } from "@/lib/supabase/server";
import { mapRankingEntry, toRankingPreview } from "@/lib/rankings/helpers";
import { getSearchFilterOptions } from "@/app/actions/search";
import type {
  AthleteRankingEntry,
  RankingCategory,
  RankingFilterOptions,
  RankingFilters,
  RankingPeriod,
  RankingPreviewAthlete,
} from "@/types/rankings";

export async function getAthleteRankings(
  filters: RankingFilters = {},
  limit = 50
): Promise<AthleteRankingEntry[]> {
  const supabase = await createClient();
  const category = filters.category ?? "overall";
  const period = filters.period ?? "month";

  const { data, error } = await supabase.rpc("get_athlete_rankings", {
    p_category: category,
    p_period: period,
    p_sport: filters.sport?.trim() || null,
    p_region: filters.region?.trim() || null,
    p_limit: limit,
  });

  if (error) {
    console.error("getAthleteRankings:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapRankingEntry(row));
}

export async function getRankingPreview(
  category: RankingCategory = "gifts_month",
  limit = 5
): Promise<RankingPreviewAthlete[]> {
  const entries = await getAthleteRankings({ category }, limit);
  return toRankingPreview(entries);
}

export async function getRankingFilterOptions(): Promise<RankingFilterOptions> {
  const options = await getSearchFilterOptions();
  return {
    sports: options.sports,
    regions: options.regions,
  };
}

export async function getRankingsPageData(
  filters: RankingFilters
): Promise<{
  entries: AthleteRankingEntry[];
  filterOptions: RankingFilterOptions;
}> {
  const [entries, filterOptions] = await Promise.all([
    getAthleteRankings(filters, 50),
    getRankingFilterOptions(),
  ]);

  return { entries, filterOptions };
}
