"use server";

import { createClient } from "@/lib/supabase/server";
import type { AthleteInvitePublic } from "@/types/athlete-invite";

export async function getAthleteInviteByToken(
  token: string
): Promise<AthleteInvitePublic | null> {
  if (!token.trim()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_athlete_invite_public", {
    p_token: token.trim(),
  });

  if (error || !data?.length) return null;

  const row = data[0] as Record<string, unknown>;
  return {
    invite_id: String(row.invite_id),
    email: String(row.email),
    full_name: String(row.full_name),
    sport: String(row.sport),
    expires_at: String(row.expires_at),
    status: row.status as AthleteInvitePublic["status"],
    is_valid: Boolean(row.is_valid),
  };
}

export async function completeAthleteInviteRegistration(
  token: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_athlete_invite_registration", {
    p_token: token.trim(),
    p_user_id: userId,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("INVITE_NOT_FOUND")) return { ok: false, error: "招待が見つかりません" };
    if (msg.includes("INVITE_INVALID")) return { ok: false, error: "招待が無効または期限切れです" };
    if (msg.includes("ALREADY_LINKED")) return { ok: false, error: "この招待は既に使用されています" };
    return { ok: false, error: "登録の紐づけに失敗しました" };
  }

  return { ok: true };
}
