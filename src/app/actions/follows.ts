"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  mapFollowStats,
  mapFollowUserEntry,
  mapRecommendedAthlete,
} from "@/lib/follows/helpers";
import type {
  FollowActionState,
  FollowStats,
  FollowUserEntry,
  RecommendedAthlete,
} from "@/types/follows";

const FOLLOW_RPC_ERROR =
  "Supabase で follows-schema.sql が未実行です。SQL Editor から実行してください";

function isMissingRpc(message: string): boolean {
  return (
    message.includes("could not find the function") ||
    message.includes("get_follow_stats") ||
    message.includes("toggle_follow")
  );
}

export async function getFollowStats(userId: string): Promise<FollowStats> {
  const current = await getCurrentProfile();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_follow_stats", {
    p_user_id: userId,
    p_viewer_id: current?.id ?? null,
  });

  if (error) {
    if (!isMissingRpc(error.message)) {
      console.error("getFollowStats:", error.message);
    }
    return mapFollowStats(null);
  }

  return mapFollowStats(data);
}

export async function listFollowers(
  userId: string,
  limit = 50,
  offset = 0
): Promise<FollowUserEntry[]> {
  const current = await getCurrentProfile();
  if (!current) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_followers", {
    p_user_id: userId,
    p_viewer_id: current.id,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("listFollowers:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapFollowUserEntry(row));
}

export async function listFollowing(
  userId: string,
  limit = 50,
  offset = 0
): Promise<FollowUserEntry[]> {
  const current = await getCurrentProfile();
  if (!current) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_following", {
    p_user_id: userId,
    p_viewer_id: current.id,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("listFollowing:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapFollowUserEntry(row));
}

export async function getMyFollowingIds(): Promise<string[]> {
  const current = await getCurrentProfile();
  if (!current) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_my_following_ids");

  if (error) {
    console.error("getMyFollowingIds:", error.message);
    return [];
  }

  return (data ?? []).map((row: { following_id: string }) => String(row.following_id));
}

export async function getRecommendedAthletes(
  limit = 12
): Promise<RecommendedAthlete[]> {
  const current = await getCurrentProfile();
  if (!current) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_recommended_athletes", {
    p_limit: limit,
  });

  if (error) {
    console.error("getRecommendedAthletes:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapRecommendedAthlete(row));
}

export async function getMyFollowingAthletes(limit = 12): Promise<FollowUserEntry[]> {
  const current = await getCurrentProfile();
  if (!current) return [];

  const entries = await listFollowing(current.id, limit, 0);
  return entries.filter((entry) => entry.account_type === "athlete");
}

export async function toggleFollow(userId: string): Promise<FollowActionState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };
  if (current.id === userId) return { error: "自分自身はフォローできません" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_follow", {
    p_following_id: userId,
  });

  if (error) {
    if (isMissingRpc(error.message)) {
      return { error: FOLLOW_RPC_ERROR };
    }
    return { error: "フォロー操作に失敗しました" };
  }

  const stats = await getFollowStats(userId);

  revalidatePath(`/profile/${userId}`);
  revalidatePath(`/followers/${userId}`);
  revalidatePath("/following");
  revalidatePath("/search");
  revalidatePath("/fan/dashboard");
  revalidatePath("/rankings");

  return {
    isFollowing: Boolean(data),
    followerCount: stats.follower_count,
  };
}
