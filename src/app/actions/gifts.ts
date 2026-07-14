"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { logGift, logGiftError } from "@/lib/gifts/gift-log";
import { createClient } from "@/lib/supabase/server";
import {
  GIFT_AMOUNTS,
  type GiftAmount,
  type GiftAthleteSummary,
  type GiftRecord,
  type GiftSendState,
  type GiftStats,
} from "@/types/gifts";

const GIFT_ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "ログインが必要です",
  INVALID_AMOUNT: "ギフト金額が正しくありません",
  MESSAGE_TOO_LONG: "メッセージは200文字以内にしてください",
  SELF_GIFT: "自分自身にギフトは送れません",
  SENDER_NOT_FAN: "ファンアカウントのみギフトを送れます",
  RECEIVER_NOT_ATHLETE: "アスリートにのみギフトを送れます",
  INSUFFICIENT_BALANCE: "ポイント残高が不足しています",
};

function translateGiftError(message: string): string {
  for (const [code, text] of Object.entries(GIFT_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  return "ギフトの送信に失敗しました";
}

function isGiftAmount(value: number): value is GiftAmount {
  return GIFT_AMOUNTS.includes(value as GiftAmount);
}

export async function getPointBalance(): Promise<number> {
  const current = await getCurrentProfile();
  if (!current || current.account_type !== "fan") return 0;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("point_balance")
    .eq("id", current.id)
    .single();

  return data?.point_balance ?? 0;
}

export async function listAthletes(): Promise<GiftAthleteSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, sport, avatar_url")
    .eq("account_type", "athlete")
    .order("name");

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    sport: String(row.sport ?? ""),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
  }));
}

async function mapProfileNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Map<string, { name: string; sport: string }>> {
  if (ids.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, name, sport")
    .in("id", ids);

  const map = new Map<string, { name: string; sport: string }>();
  for (const row of data ?? []) {
    map.set(String(row.id), {
      name: String(row.name ?? ""),
      sport: String(row.sport ?? ""),
    });
  }
  return map;
}

export async function getSentGifts(): Promise<GiftRecord[]> {
  const current = await getCurrentProfile();
  if (!current || current.account_type !== "fan") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gifts")
    .select("id, amount, message, created_at, sender_id, receiver_id")
    .eq("sender_id", current.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const profileMap = await mapProfileNames(
    supabase,
    [...new Set(data.map((row) => String(row.receiver_id)))]
  );

  return data.map((row) => {
    const receiver = profileMap.get(String(row.receiver_id));
    return {
      id: String(row.id),
      amount: row.amount as GiftAmount,
      message: String(row.message ?? ""),
      created_at: String(row.created_at),
      sender_id: String(row.sender_id),
      receiver_id: String(row.receiver_id),
      sender_name: current.name,
      receiver_name: receiver?.name || "不明",
      receiver_sport: receiver?.sport || "",
    };
  });
}

export async function getReceivedGifts(): Promise<GiftRecord[]> {
  const current = await getCurrentProfile();
  if (!current || current.account_type !== "athlete") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gifts")
    .select("id, amount, message, created_at, sender_id, receiver_id")
    .eq("receiver_id", current.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const profileMap = await mapProfileNames(
    supabase,
    [...new Set(data.map((row) => String(row.sender_id)))]
  );

  return data.map((row) => {
    const sender = profileMap.get(String(row.sender_id));
    return {
      id: String(row.id),
      amount: row.amount as GiftAmount,
      message: String(row.message ?? ""),
      created_at: String(row.created_at),
      sender_id: String(row.sender_id),
      receiver_id: String(row.receiver_id),
      sender_name: sender?.name || "匿名ファン",
      receiver_name: current.name,
    };
  });
}

export async function getAthleteGiftStats(): Promise<GiftStats> {
  const current = await getCurrentProfile();
  if (!current || current.account_type !== "athlete") {
    return { totalReceived: 0, giftCount: 0, pointBalance: 0 };
  }

  const supabase = await createClient();
  const [giftsRes, profileRes] = await Promise.all([
    supabase.from("gifts").select("amount").eq("receiver_id", current.id),
    supabase.from("profiles").select("earnings_balance").eq("id", current.id).maybeSingle(),
  ]);

  const gifts = giftsRes.data ?? [];
  const totalReceived = gifts.reduce((sum, gift) => sum + Number(gift.amount), 0);

  return {
    totalReceived,
    giftCount: gifts.length,
    pointBalance: Number(profileRes.data?.earnings_balance ?? 0),
  };
}

export async function getFanGiftStats(): Promise<GiftStats> {
  const balance = await getPointBalance();
  const sent = await getSentGifts();
  const totalSent = sent.reduce((sum, gift) => sum + gift.amount, 0);

  return {
    totalReceived: totalSent,
    giftCount: sent.length,
    pointBalance: balance,
  };
}

export async function sendGift(
  _prevState: GiftSendState | null,
  formData: FormData
): Promise<GiftSendState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };
  if (current.account_type !== "fan") {
    return { error: "ファンアカウントのみギフトを送れます" };
  }

  const receiverId = String(formData.get("receiver_id") ?? "").trim();
  const amountValue = Number(formData.get("amount"));
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: GiftSendState["fieldErrors"] = {};

  if (!receiverId) {
    return { error: "送信先が指定されていません" };
  }

  if (!isGiftAmount(amountValue)) {
    fieldErrors.amount = "ギフト金額を選択してください";
  }

  if (message.length > 200) {
    fieldErrors.message = "メッセージは200文字以内にしてください";
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const idempotencyKey = String(formData.get("idempotency_key") ?? "").trim();

  logGift("send started", {
    receiver_id: receiverId.slice(0, 8) + "...",
    amount: amountValue,
    has_idempotency_key: Boolean(idempotencyKey),
  });

  const rpcArgs = {
    p_receiver_id: receiverId,
    p_amount: amountValue,
    p_message: message,
    p_idempotency_key: idempotencyKey || null,
  };

  let { data, error } = await supabase.rpc("send_gift", rpcArgs);

  if (error && idempotencyKey && /p_idempotency_key|send_gift\(/i.test(error.message)) {
    logGift("idempotency RPC unavailable, retrying legacy send_gift", {
      receiver_id: receiverId.slice(0, 8) + "...",
      amount: amountValue,
    });
    ({ data, error } = await supabase.rpc("send_gift", {
      p_receiver_id: receiverId,
      p_amount: amountValue,
      p_message: message,
    }));
  }

  if (error) {
    logGiftError("send failed", error, {
      receiver_id: receiverId.slice(0, 8) + "...",
      amount: amountValue,
    });
    return { error: translateGiftError(error.message) };
  }

  if (!data) {
    logGift("send returned empty gift id", {
      receiver_id: receiverId.slice(0, 8) + "...",
      amount: amountValue,
    });
    return { error: "ギフトの送信に失敗しました" };
  }

  logGift("send completed", {
    gift_id: String(data).slice(0, 8) + "...",
    amount: amountValue,
  });

  revalidatePath("/fan/gifts");
  revalidatePath("/fan/dashboard");
  revalidatePath("/athlete/gifts");
  revalidatePath("/athlete/dashboard");
  revalidatePath("/athlete/earnings");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/gift/send/${receiverId}`);
  revalidatePath(`/profile/${receiverId}`);

  return { success: "ギフトを送信しました" };
}

export async function getAthleteForGift(
  athleteId: string
): Promise<GiftAthleteSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, sport, avatar_url, account_type")
    .eq("id", athleteId)
    .single();

  if (!data || data.account_type !== "athlete") return null;

  return {
    id: String(data.id),
    name: String(data.name ?? ""),
    sport: String(data.sport ?? ""),
    avatar_url: data.avatar_url ? String(data.avatar_url) : null,
  };
}
