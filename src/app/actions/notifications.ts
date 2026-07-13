"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  NotificationActionState,
  NotificationRecord,
  NotificationType,
} from "@/types/notifications";

function mapNotification(row: Record<string, unknown>): NotificationRecord {
  const actor = Array.isArray(row.actor)
    ? row.actor[0]
    : row.actor;

  return {
    id: String(row.id),
    type: row.type as NotificationType,
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    link_url: String(row.link_url ?? "/notifications"),
    is_read: Boolean(row.is_read),
    created_at: String(row.created_at ?? ""),
    actor_id: row.actor_id ? String(row.actor_id) : null,
    actor_name: actor?.name ? String(actor.name) : null,
    actor_avatar_url: actor?.avatar_url ? String(actor.avatar_url) : null,
  };
}

function translateNotificationError(message: string): string {
  if (
    message.includes("notifications") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  ) {
    return "Supabase で notifications-schema.sql が未実行です。SQL Editor から実行してください";
  }
  return "通知の処理に失敗しました";
}

export async function getUnreadNotificationCount(): Promise<number> {
  const current = await getCurrentProfile();
  if (!current) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", current.id)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

export async function getNotifications(limit = 50): Promise<NotificationRecord[]> {
  const current = await getCurrentProfile();
  if (!current) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, title, body, link_url, is_read, created_at, actor_id"
    )
    .eq("recipient_id", current.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const actorIds = [
    ...new Set(data.map((row) => row.actor_id).filter(Boolean)),
  ] as string[];

  const profileMap = new Map<string, { name: string; avatar_url: string | null }>();

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", actorIds);

    for (const profile of profiles ?? []) {
      profileMap.set(String(profile.id), {
        name: String(profile.name ?? ""),
        avatar_url: profile.avatar_url ? String(profile.avatar_url) : null,
      });
    }
  }

  return data.map((row) => {
    const actor = row.actor_id
      ? profileMap.get(String(row.actor_id))
      : undefined;

    return mapNotification({
      ...row,
      actor: actor
        ? { name: actor.name, avatar_url: actor.avatar_url }
        : null,
    });
  });
}

export async function markNotificationReadAndGo(
  notificationId: string
): Promise<void> {
  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  const supabase = await createClient();

  const { data: notification } = await supabase
    .from("notifications")
    .select("link_url")
    .eq("id", notificationId)
    .eq("recipient_id", current.id)
    .maybeSingle();

  await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  revalidatePath("/notifications");
  revalidatePath("/feed");
  revalidatePath("/fan/dashboard");

  redirect(notification?.link_url ?? "/notifications");
}

export async function markAllNotificationsRead(): Promise<NotificationActionState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_all_notifications_read");

  if (error) {
    return { error: translateNotificationError(error.message) };
  }

  revalidatePath("/notifications");
  revalidatePath("/feed");
  revalidatePath("/fan/dashboard");

  return { success: "すべて既読にしました" };
}
