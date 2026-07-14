"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/server";
import {
  mapAthleteApplicationRow,
  type AdminAthleteApplicationRow,
  type AdminReviewActionState,
  type AthleteApplicationAuditEntry,
  type AthleteReviewStatus,
} from "@/types/athlete-application";

const REVIEW_ERROR_MESSAGES: Record<string, string> = {
  NOT_ADMIN: "管理者権限がありません",
  APPLICATION_NOT_FOUND: "申請が見つかりません",
  INVALID_ACTION: "操作が正しくありません",
};

function translateReviewError(message: string): string {
  for (const [code, text] of Object.entries(REVIEW_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  if (
    message.includes("admin_review_athlete_application") ||
    message.includes("could not find the function")
  ) {
    return "Supabase で athlete-application-schema.sql が未実行です。SQL Editor から実行してください";
  }
  return "審査操作に失敗しました";
}

export type AdminApplicationFilters = {
  status?: AthleteReviewStatus | "all";
  query?: string;
};

export async function listAthleteApplications(
  filters: AdminApplicationFilters = {}
): Promise<AdminAthleteApplicationRow[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("athlete_applications")
    .select(
      "id, user_id, full_name, sport, team, region, career_history, achievements, bio, instagram_url, tiktok_url, x_url, profile_image_url, identity_doc_path, status, review_note, reviewed_by, reviewed_at, submitted_at, created_at, updated_at, profiles!athlete_applications_user_id_fkey(name, email)"
    )
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("listAthleteApplications:", error?.message);
    return [];
  }

  const rows = data.map((row) => {
    const profiles = row.profiles as { name?: string; email?: string } | null;
    const application = mapAthleteApplicationRow(row, { includeIdentityDoc: true });
    return {
      ...application,
      user_name: String(profiles?.name ?? application.full_name),
      user_email: String(profiles?.email ?? ""),
    };
  });

  const search = filters.query?.trim().toLowerCase();
  if (!search) return rows;

  return rows.filter(
    (row) =>
      row.full_name.toLowerCase().includes(search) ||
      row.user_name.toLowerCase().includes(search) ||
      row.user_email.toLowerCase().includes(search) ||
      row.sport.toLowerCase().includes(search)
  );
}

export async function getApplicationAuditLog(
  userId: string
): Promise<AthleteApplicationAuditEntry[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("athlete_application_audit_log")
    .select(
      "id, application_id, user_id, admin_id, action, previous_status, new_status, note, created_at, profiles!athlete_application_audit_log_admin_id_fkey(name)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row) => {
    const adminProfile = row.profiles as { name?: string } | null;
    return {
      id: String(row.id),
      application_id: row.application_id ? String(row.application_id) : null,
      user_id: String(row.user_id),
      admin_id: String(row.admin_id),
      action: String(row.action),
      previous_status: row.previous_status as AthleteReviewStatus | null,
      new_status: row.new_status as AthleteReviewStatus | null,
      note: String(row.note ?? ""),
      created_at: String(row.created_at),
      admin_name: adminProfile?.name ? String(adminProfile.name) : undefined,
    };
  });
}

export async function getIdentityDocSignedUrl(
  identityDocPath: string
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  if (!identityDocPath) return { error: "書類が見つかりません" };

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("athlete-identity-docs")
    .createSignedUrl(identityDocPath, 300);

  if (error || !data?.signedUrl) {
    return { error: "本人確認書類の取得に失敗しました" };
  }

  return { url: data.signedUrl };
}

export async function reviewAthleteApplication(
  _prevState: AdminReviewActionState | null,
  formData: FormData
): Promise<AdminReviewActionState> {
  await requireAdmin();

  const applicationId = String(formData.get("application_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!applicationId) return { error: "申請IDが不正です" };
  if (!["approve", "reject", "resubmit_request", "suspend"].includes(action)) {
    return { error: "操作が正しくありません" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_athlete_application", {
    p_application_id: applicationId,
    p_action: action,
    p_note: note,
  });

  if (error) {
    return { error: translateReviewError(error.message) };
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/dashboard");
  revalidatePath("/athlete/apply");

  const successMessages: Record<string, string> = {
    approve: "申請を承認しました",
    reject: "申請を却下しました",
    resubmit_request: "再提出を依頼しました",
    suspend: "アスリート機能を利用停止にしました",
  };

  return { success: successMessages[action] ?? "操作を完了しました" };
}
