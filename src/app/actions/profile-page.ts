"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { getAthleteFanclubPage } from "@/app/actions/fanclub";
import { getAthleteRankings } from "@/app/actions/rankings";
import { createClient } from "@/lib/supabase/server";
import { mapEventSummary } from "@/lib/events/helpers";
import type { EventSummary } from "@/types/events";
import type {
  AthleteProfilePageData,
  AthleteProfileStats,
  AthleteRecentGift,
} from "@/types/profile-page";

const EMPTY_STATS: AthleteProfileStats = {
  follower_count: 0,
  gift_total: 0,
  monthly_gift_total: 0,
  is_following: false,
  rank: null,
};

function parseStats(raw: unknown): AthleteProfileStats {
  if (!raw || typeof raw !== "object") return EMPTY_STATS;
  const data = raw as Record<string, unknown>;
  return {
    follower_count: Number(data.follower_count ?? 0),
    gift_total: Number(data.gift_total ?? 0),
    monthly_gift_total: Number(data.monthly_gift_total ?? 0),
    is_following: Boolean(data.is_following),
    rank: data.rank == null ? null : Number(data.rank),
  };
}

async function listAthleteEvents(athleteId: string, limit = 6): Promise<EventSummary[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_events", {
    p_scope: "all",
    p_creator_id: null,
    p_user_id: profile.id,
    p_limit: 100,
  });

  if (error || !data) return [];

  const now = Date.now();
  return (data as Record<string, unknown>[])
    .map((row) => mapEventSummary(row))
    .filter(
      (event) =>
        event.creator_id === athleteId &&
        event.status === "published" &&
        new Date(event.starts_at).getTime() >= now - 3600000
    )
    .slice(0, limit);
}

export async function getAthleteProfilePageData(
  athleteId: string
): Promise<AthleteProfilePageData> {
  const current = await getCurrentProfile();
  const supabase = await createClient();

  const [statsResult, giftsResult, fanclubPage, rankingEntries, events] =
    await Promise.all([
      supabase.rpc("get_athlete_profile_stats", {
        p_athlete_id: athleteId,
        p_viewer_id: current?.id ?? null,
      }),
      supabase.rpc("get_athlete_recent_gifts", {
        p_athlete_id: athleteId,
        p_limit: 5,
      }),
      getAthleteFanclubPage(athleteId),
      getAthleteRankings({ category: "gifts_month" }, 10),
      listAthleteEvents(athleteId, 6),
    ]);

  if (statsResult.error) {
    console.error("get_athlete_profile_stats:", statsResult.error.message);
  }

  const stats = statsResult.error ? EMPTY_STATS : parseStats(statsResult.data);

  const recent_gifts: AthleteRecentGift[] = (giftsResult.data ?? []).map(
    (row: Record<string, unknown>) => ({
      id: String(row.id),
      amount: Number(row.amount),
      message: String(row.message ?? ""),
      created_at: String(row.created_at),
      sender_name: String(row.sender_name ?? "匿名ファン"),
    })
  );

  const exclusive_posts = (fanclubPage?.posts ?? []).filter(
    (post) => post.post_type === "video" || post.post_type === "post"
  );

  return {
    stats,
    recent_gifts,
    events,
    exclusive_posts: exclusive_posts.slice(0, 4),
    ranking_entries: rankingEntries,
    has_fanclub: Boolean(fanclubPage?.plans?.length),
  };
}
