import type { AccountType } from "@/types/auth";
import type { AthleteSearchResult, UserSearchResult } from "@/types/search";

export function mapAthlete(row: Record<string, unknown>): AthleteSearchResult {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    sport: String(row.sport ?? ""),
    team: String(row.team ?? ""),
    region: String(row.region ?? ""),
    gender: String(row.gender ?? ""),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    account_type: row.account_type as AccountType,
    follower_count: Number(row.follower_count ?? 0),
    gift_total: Number(row.gift_total ?? 0),
    recent_gift_total: Number(row.recent_gift_total ?? 0),
    post_count: Number(row.post_count ?? 0),
    created_at: String(row.created_at ?? ""),
  };
}

export function mapUser(row: Record<string, unknown>): UserSearchResult {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    sport: String(row.sport ?? ""),
    region: String(row.region ?? ""),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    account_type: row.account_type as AccountType,
  };
}

export function translateSearchError(message: string): string {
  if (
    message.includes("search_athletes") ||
    message.includes("could not find the function") ||
    message.includes("schema cache")
  ) {
    return "Supabase で search-schema.sql が未実行です。SQL Editor から実行してください";
  }
  return "検索に失敗しました";
}
