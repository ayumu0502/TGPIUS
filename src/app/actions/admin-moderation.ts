"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminActionState,
  AdminAuditEntry,
  AdminBlock,
  AdminComment,
  AdminEvent,
  AdminExclusivePost,
  AdminPost,
  AdminRefund,
  AdminReport,
} from "@/types/admin";
import type { AccountType } from "@/types/auth";

const MOD_ERROR_MESSAGES: Record<string, string> = {
  NOT_ADMIN: "管理者権限がありません",
  POST_NOT_FOUND: "投稿が見つかりません",
  COMMENT_NOT_FOUND: "コメントが見つかりません",
  EVENT_NOT_FOUND: "イベントが見つかりません",
  REPORT_NOT_FOUND: "通報が見つかりません",
  INVALID_STATUS: "ステータスが正しくありません",
};

function translateModError(message: string): string {
  for (const [code, text] of Object.entries(MOD_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  if (message.includes("could not find the function")) {
    return "Supabase で admin-console-schema.sql が未実行です。SQL Editor から実行してください";
  }
  return "操作に失敗しました";
}

async function profileNameMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, name").in("id", ids);
  return new Map((data ?? []).map((row) => [String(row.id), String(row.name ?? "不明")]));
}

export async function listUsersForAdmin(options?: {
  query?: string;
  accountType?: AccountType | "all";
  limit?: number;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const limit = options?.limit ?? 50;

  let query = supabase
    .from("profiles")
    .select(
      "id, name, email, account_type, is_suspended, is_admin, point_balance, athlete_review_status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.accountType && options.accountType !== "all") {
    query = query.eq("account_type", options.accountType);
  }

  const search = options?.query?.trim();
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function listUserReports(status = "pending"): Promise<AdminReport[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("user_reports")
    .select("id, reporter_id, reported_id, reason, context_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const ids = [
    ...new Set([
      ...data.map((r) => String(r.reporter_id)),
      ...data.map((r) => String(r.reported_id)),
    ]),
  ];
  const names = await profileNameMap(ids);

  return data.map((row) => ({
    id: String(row.id),
    reporter_name: names.get(String(row.reporter_id)) ?? "不明",
    reported_name: names.get(String(row.reported_id)) ?? "不明",
    reason: String(row.reason ?? ""),
    context_type: String(row.context_type ?? ""),
    status: String(row.status ?? ""),
    created_at: String(row.created_at),
  }));
}

export async function listUserBlocks(): Promise<AdminBlock[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_blocks")
    .select("id, blocker_id, blocked_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  const ids = [
    ...new Set([
      ...data.map((r) => String(r.blocker_id)),
      ...data.map((r) => String(r.blocked_id)),
    ]),
  ];
  const names = await profileNameMap(ids);

  return data.map((row) => ({
    id: String(row.id),
    blocker_name: names.get(String(row.blocker_id)) ?? "不明",
    blocked_name: names.get(String(row.blocked_id)) ?? "不明",
    created_at: String(row.created_at),
  }));
}

export async function listPostsForAdmin(query?: string): Promise<AdminPost[]> {
  await requireAdmin();
  const supabase = await createClient();

  let dbQuery = supabase
    .from("posts")
    .select("id, user_id, caption, media_type, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const search = query?.trim();
  if (search) {
    dbQuery = dbQuery.ilike("caption", `%${search}%`);
  }

  const { data } = await dbQuery;
  if (!data?.length) return [];

  const names = await profileNameMap(data.map((r) => String(r.user_id)));
  return data.map((row) => ({
    id: String(row.id),
    user_name: names.get(String(row.user_id)) ?? "不明",
    caption: String(row.caption ?? ""),
    media_type: String(row.media_type),
    created_at: String(row.created_at),
  }));
}

export async function listCommentsForAdmin(query?: string): Promise<AdminComment[]> {
  await requireAdmin();
  const supabase = await createClient();

  let dbQuery = supabase
    .from("comments")
    .select("id, user_id, post_id, content, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const search = query?.trim();
  if (search) {
    dbQuery = dbQuery.ilike("content", `%${search}%`);
  }

  const { data } = await dbQuery;
  if (!data?.length) return [];

  const names = await profileNameMap(data.map((r) => String(r.user_id)));
  return data.map((row) => ({
    id: String(row.id),
    user_name: names.get(String(row.user_id)) ?? "不明",
    post_id: String(row.post_id),
    content: String(row.content ?? ""),
    created_at: String(row.created_at),
  }));
}

export async function listEventsForAdmin(): Promise<AdminEvent[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, creator_id, title, starts_at, status, capacity, fee_points")
    .order("starts_at", { ascending: false })
    .limit(50);

  if (!data?.length) return [];

  const names = await profileNameMap(data.map((r) => String(r.creator_id)));
  return data.map((row) => ({
    id: String(row.id),
    creator_name: names.get(String(row.creator_id)) ?? "不明",
    title: String(row.title),
    starts_at: String(row.starts_at),
    status: String(row.status),
    capacity: Number(row.capacity),
    fee_points: Number(row.fee_points),
  }));
}

export async function listExclusivePostsForAdmin(): Promise<AdminExclusivePost[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("fanclub_posts")
    .select("id, athlete_id, title, post_type, is_members_only, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data?.length) return [];

  const names = await profileNameMap(data.map((r) => String(r.athlete_id)));
  return data.map((row) => ({
    id: String(row.id),
    athlete_name: names.get(String(row.athlete_id)) ?? "不明",
    title: String(row.title),
    post_type: String(row.post_type),
    is_members_only: Boolean(row.is_members_only),
    created_at: String(row.created_at),
  }));
}

export async function getRefundRecords(limit = 30): Promise<AdminRefund[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("billing_records")
    .select("id, user_id, amount_yen, description, created_at")
    .eq("record_type", "refund")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data?.length) return [];

  const names = await profileNameMap(data.map((r) => String(r.user_id)));
  return data.map((row) => ({
    id: String(row.id),
    user_name: names.get(String(row.user_id)) ?? "不明",
    amount_yen: Number(row.amount_yen),
    description: String(row.description ?? ""),
    created_at: String(row.created_at),
  }));
}

export async function getAdminAuditLog(limit = 100): Promise<AdminAuditEntry[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, admin_id, action, target_type, target_id, note, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const names = await profileNameMap(data.map((r) => String(r.admin_id)));
  return data.map((row) => ({
    id: String(row.id),
    admin_name: names.get(String(row.admin_id)) ?? "不明",
    action: String(row.action),
    target_type: String(row.target_type),
    target_id: row.target_id ? String(row.target_id) : null,
    note: String(row.note ?? ""),
    created_at: String(row.created_at),
  }));
}

export async function updateReportStatus(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const reportId = String(formData.get("report_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!reportId || !status) return { error: "入力が不正です" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_report_status", {
    p_report_id: reportId,
    p_status: status,
  });

  if (error) return { error: translateModError(error.message) };

  revalidatePath("/admin/reports");
  revalidatePath("/admin/audit");
  return { success: "通報ステータスを更新しました" };
}

export async function adminDeletePost(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return { error: "投稿IDが不正です" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_post", { p_post_id: postId });
  if (error) return { error: translateModError(error.message) };

  revalidatePath("/admin/posts");
  revalidatePath("/admin/audit");
  revalidatePath("/feed");
  return { success: "投稿を削除しました" };
}

export async function adminDeleteComment(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const commentId = String(formData.get("comment_id") ?? "");
  if (!commentId) return { error: "コメントIDが不正です" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_comment", {
    p_comment_id: commentId,
  });
  if (error) return { error: translateModError(error.message) };

  revalidatePath("/admin/comments");
  revalidatePath("/admin/audit");
  return { success: "コメントを削除しました" };
}

export async function adminCancelEvent(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const eventId = String(formData.get("event_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!eventId) return { error: "イベントIDが不正です" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_cancel_event", {
    p_event_id: eventId,
    p_note: note,
  });
  if (error) return { error: translateModError(error.message) };

  revalidatePath("/admin/events");
  revalidatePath("/admin/audit");
  revalidatePath("/events");
  return { success: "イベントをキャンセルしました" };
}

export async function adminDeleteExclusivePost(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return { error: "投稿IDが不正です" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_fanclub_post", {
    p_post_id: postId,
  });
  if (error) return { error: translateModError(error.message) };

  revalidatePath("/admin/exclusive");
  revalidatePath("/admin/audit");
  return { success: "限定コンテンツを削除しました" };
}
