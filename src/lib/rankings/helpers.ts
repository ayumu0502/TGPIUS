import type { AthleteRankingEntry, RankingPreviewAthlete } from "@/types/rankings";

export function mapRankingEntry(row: Record<string, unknown>): AthleteRankingEntry {
  return {
    rank: Number(row.rank ?? 0),
    id: String(row.id),
    name: String(row.name ?? ""),
    sport: String(row.sport ?? ""),
    team: String(row.team ?? ""),
    region: String(row.region ?? ""),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    score: Number(row.score ?? 0),
    gift_score: Number(row.gift_score ?? 0),
    follower_score: Number(row.follower_score ?? 0),
    like_score: Number(row.like_score ?? 0),
  };
}

export function toRankingPreview(
  entries: AthleteRankingEntry[]
): RankingPreviewAthlete[] {
  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    sport: entry.sport,
    avatarUrl: entry.avatar_url,
    score: entry.score,
    rank: entry.rank,
  }));
}
