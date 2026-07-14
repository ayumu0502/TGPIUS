"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { isApprovedAthlete } from "@/lib/athlete/status";
import { createClient } from "@/lib/supabase/server";
import { mapEventParticipant, mapEventSummary } from "@/lib/events/helpers";
import type {
  CreateEventInput,
  EventActionState,
  EventParticipant,
  EventSummary,
} from "@/types/events";

const EVENT_ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "ログインが必要です",
  CREATOR_NOT_ATHLETE: "アスリートのみイベントを作成できます",
  TITLE_REQUIRED: "タイトルを入力してください",
  INVALID_CAPACITY: "定員が正しくありません",
  INVALID_FEE: "参加費が正しくありません",
  EVENT_NOT_FOUND: "イベントが見つかりません",
  EVENT_NOT_OPEN: "このイベントは現在参加できません",
  EVENT_ALREADY_STARTED: "開催済みのイベントは変更できません",
  CREATOR_CANNOT_JOIN: "作成者は自分のイベントに参加できません",
  ALREADY_JOINED: "すでに参加登録済みです",
  EVENT_FULL: "定員に達しています",
  PAID_EVENT_FAN_ONLY: "有料イベントはファンアカウントのみ参加できます",
  INSUFFICIENT_BALANCE: "ポイント残高が不足しています",
  NOT_REGISTERED: "参加登録がありません",
  NOT_EVENT_CREATOR: "イベント作成者のみ操作できます",
  INVALID_CHECKIN_CODE: "チェックインコードが正しくありません",
  PARTICIPANT_NOT_FOUND: "参加者が見つかりません",
  ALREADY_CHECKED_IN: "すでにチェックイン済みです",
};

function translateEventError(message: string): string {
  for (const [code, text] of Object.entries(EVENT_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  if (message.includes("create_event") || message.includes("could not find the function")) {
    return "Supabase で events-schema.sql が未実行です。SQL Editor から実行してください";
  }
  return "イベント操作に失敗しました";
}

async function listEventsByScope(
  scope: "upcoming" | "past" | "mine" | "joined" | "all",
  limit = 50
): Promise<EventSummary[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_events", {
    p_scope: scope,
    p_creator_id: scope === "mine" ? profile.id : null,
    p_user_id: profile.id,
    p_limit: limit,
  });

  if (error) {
    console.error("listEventsByScope:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapEventSummary(row));
}

export async function listUpcomingEvents(limit = 50): Promise<EventSummary[]> {
  return listEventsByScope("upcoming", limit);
}

export async function listMyCreatedEvents(limit = 50): Promise<EventSummary[]> {
  return listEventsByScope("mine", limit);
}

export async function listMyJoinedEvents(limit = 50): Promise<EventSummary[]> {
  return listEventsByScope("joined", limit);
}

export async function getNextUpcomingEvent(): Promise<EventSummary | null> {
  const events = await listUpcomingEvents(1);
  return events[0] ?? null;
}

export async function getEventById(eventId: string): Promise<EventSummary | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_events", {
    p_scope: "all",
    p_creator_id: null,
    p_user_id: profile.id,
    p_limit: 200,
  });

  if (error) return null;

  const event = (data ?? [])
    .map((row: Record<string, unknown>) => mapEventSummary(row))
    .find((item: EventSummary) => item.id === eventId);

  return event ?? null;
}

export async function getEventParticipants(
  eventId: string
): Promise<EventParticipant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_event_participants", {
    p_event_id: eventId,
  });

  if (error) {
    console.error("getEventParticipants:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) =>
    mapEventParticipant(row)
  );
}

export async function createEvent(
  input: CreateEventInput
): Promise<EventActionState & { eventId?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false, message: "ログインが必要です" };
  }

  if (profile.account_type !== "athlete") {
    return { ok: false, message: "アスリートのみイベントを作成できます" };
  }
  if (!isApprovedAthlete(profile)) {
    return { ok: false, message: "選手申請の承認後にイベントを作成できます" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_event", {
    p_title: input.title.trim(),
    p_starts_at: input.starts_at,
    p_description: input.description?.trim() ?? "",
    p_ends_at: input.ends_at || null,
    p_location_type: input.location_type,
    p_venue_name: input.venue_name?.trim() ?? "",
    p_venue_address: input.venue_address?.trim() ?? "",
    p_online_url: input.online_url?.trim() ?? "",
    p_capacity: input.capacity,
    p_fee_points: input.fee_points,
    p_status: input.status ?? "published",
  });

  if (error) {
    return { ok: false, message: translateEventError(error.message) };
  }

  revalidatePath("/events");
  revalidatePath("/events/my");
  revalidatePath("/athlete/dashboard");
  revalidatePath("/fan/dashboard");

  return { ok: true, message: "イベントを作成しました", eventId: String(data) };
}

export async function joinEvent(eventId: string): Promise<EventActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_event", { p_event_id: eventId });

  if (error) {
    return { ok: false, message: translateEventError(error.message) };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/events/my");
  revalidatePath("/fan/dashboard");

  return { ok: true, message: "イベントに参加登録しました" };
}

export async function cancelEventParticipation(
  eventId: string
): Promise<EventActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event_participation", {
    p_event_id: eventId,
  });

  if (error) {
    return { ok: false, message: translateEventError(error.message) };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/events/my");
  revalidatePath("/fan/dashboard");

  return { ok: true, message: "参加をキャンセルしました" };
}

export async function checkinParticipant(
  eventId: string,
  userId: string,
  code: string
): Promise<EventActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("checkin_event", {
    p_event_id: eventId,
    p_user_id: userId,
    p_code: code,
  });

  if (error) {
    return { ok: false, message: translateEventError(error.message) };
  }

  revalidatePath(`/events/${eventId}`);

  return { ok: true, message: "チェックインしました" };
}

export async function createEventAction(
  _prev: EventActionState,
  formData: FormData
): Promise<EventActionState & { eventId?: string }> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  const locationType = String(formData.get("location_type") ?? "offline");
  const venueName = String(formData.get("venue_name") ?? "").trim();
  const venueAddress = String(formData.get("venue_address") ?? "").trim();
  const onlineUrl = String(formData.get("online_url") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 50);
  const feePoints = Number(formData.get("fee_points") ?? 0);
  const isFree = formData.get("is_free") === "on";

  if (!title) return { ok: false, message: "タイトルを入力してください" };
  if (!startsAt) return { ok: false, message: "開催日時を入力してください" };
  if (!Number.isFinite(capacity) || capacity < 1) {
    return { ok: false, message: "定員を正しく入力してください" };
  }

  const result = await createEvent({
    title,
    description,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
    location_type: locationType as CreateEventInput["location_type"],
    venue_name: venueName,
    venue_address: venueAddress,
    online_url: onlineUrl,
    capacity,
    fee_points: isFree ? 0 : Math.max(0, feePoints),
  });

  if (result.ok && result.eventId) {
    redirect(`/events/${result.eventId}`);
  }

  return result;
}
