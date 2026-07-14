"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/admin";
import { buildAthleteInviteUrl, sendAthleteInviteEmail } from "@/lib/athlete/invite-mail";
import { createClient } from "@/lib/supabase/server";
import type { AthleteReviewStatus } from "@/types/athlete-application";
import type {
  AdminAthleteFormState,
  BulkImportState,
  Organization,
  OrganizationStatus,
  OrganizationType,
  ProvisionalAthleteProfile,
} from "@/types/athlete-invite";
import type { MembershipStatus } from "@/types/athlete-invite";

const RPC_ERRORS: Record<string, string> = {
  NOT_ADMIN: "管理者権限が必要です",
  REQUIRED_FIELDS: "必須項目を入力してください",
  INVITE_NOT_FOUND: "招待が見つかりません",
  INVITE_INVALID: "招待が無効または期限切れです",
};

function mapRpcError(message: string): string {
  for (const [code, label] of Object.entries(RPC_ERRORS)) {
    if (message.includes(code)) return label;
  }
  return "操作に失敗しました。時間をおいて再度お試しください";
}

function parseReviewStatus(value: string): AthleteReviewStatus {
  const allowed: AthleteReviewStatus[] = [
    "not_applied",
    "pending",
    "approved",
    "rejected",
    "resubmit",
    "suspended",
  ];
  return allowed.includes(value as AthleteReviewStatus)
    ? (value as AthleteReviewStatus)
    : "approved";
}

export async function listOrganizations(): Promise<Organization[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, org_type, description, region, status, admin_note, created_at, updated_at")
    .order("name");

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    org_type: row.org_type as OrganizationType,
    description: String(row.description ?? ""),
    region: String(row.region ?? ""),
    status: row.status as OrganizationStatus,
    admin_note: String(row.admin_note ?? ""),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

export async function listProvisionalAthletes(): Promise<ProvisionalAthleteProfile[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("athlete_provisional_profiles")
    .select(
      "id, email, full_name, sport, team, agency, region, career_history, achievements, bio, goals, is_public, review_status, admin_note, organization_id, linked_user_id, created_at, updated_at, organizations(name)"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const ids = data.map((row) => String(row.id));
  const { data: invites } = ids.length
    ? await supabase
        .from("athlete_invites")
        .select("provisional_profile_id, status, expires_at, sent_at")
        .in("provisional_profile_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] };

  const inviteByProvisional = new Map<string, Record<string, unknown>>();
  for (const inv of invites ?? []) {
    const key = String(inv.provisional_profile_id);
    if (!inviteByProvisional.has(key)) {
      inviteByProvisional.set(key, inv as Record<string, unknown>);
    }
  }

  return data.map((row) => {
    const latestInvite = inviteByProvisional.get(String(row.id));
    const org = row.organizations as { name?: string } | null;

    return {
      id: String(row.id),
      email: String(row.email),
      full_name: String(row.full_name),
      sport: String(row.sport),
      team: String(row.team ?? ""),
      agency: String(row.agency ?? ""),
      region: String(row.region ?? ""),
      career_history: String(row.career_history ?? ""),
      achievements: String(row.achievements ?? ""),
      bio: String(row.bio ?? ""),
      goals: String(row.goals ?? ""),
      is_public: Boolean(row.is_public),
      review_status: row.review_status as AthleteReviewStatus,
      admin_note: String(row.admin_note ?? ""),
      organization_id: row.organization_id ? String(row.organization_id) : null,
      organization_name: org?.name ?? null,
      linked_user_id: row.linked_user_id ? String(row.linked_user_id) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      invite_status: latestInvite?.status as ProvisionalAthleteProfile["invite_status"],
      invite_expires_at: latestInvite?.expires_at
        ? String(latestInvite.expires_at)
        : null,
      invite_sent_at: latestInvite?.sent_at ? String(latestInvite.sent_at) : null,
    };
  });
}

export async function createProvisionalAthlete(
  _prev: AdminAthleteFormState | null,
  formData: FormData
): Promise<AdminAthleteFormState> {
  await requireAdmin();
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const sport = String(formData.get("sport") ?? "").trim();

  if (!email || !fullName || !sport) {
    return { fieldErrors: { email: !email ? "必須" : undefined, full_name: !fullName ? "必須" : undefined, sport: !sport ? "必須" : undefined } };
  }

  const expiresDays = Number(formData.get("expires_days") ?? 14);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(expiresDays) ? expiresDays : 14));

  const { data: provisionalId, error } = await supabase.rpc("admin_create_provisional_athlete", {
    p_email: email,
    p_full_name: fullName,
    p_sport: sport,
    p_team: String(formData.get("team") ?? ""),
    p_agency: String(formData.get("agency") ?? ""),
    p_region: String(formData.get("region") ?? ""),
    p_career_history: String(formData.get("career_history") ?? ""),
    p_achievements: String(formData.get("achievements") ?? ""),
    p_bio: String(formData.get("bio") ?? ""),
    p_goals: String(formData.get("goals") ?? ""),
    p_is_public: formData.get("is_public") === "on",
    p_review_status: parseReviewStatus(String(formData.get("review_status") ?? "approved")),
    p_admin_note: String(formData.get("admin_note") ?? ""),
    p_organization_id: String(formData.get("organization_id") ?? "") || null,
    p_expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return { error: mapRpcError(error.message) };
  }

  const sendInvite = formData.get("send_invite") === "on";
  if (sendInvite) {
    const sendResult = await sendInviteForProvisional(String(provisionalId));
    if (sendResult.error) {
      return {
        success: "仮登録を作成しましたが、招待メールの送信に失敗しました",
        provisionalId: String(provisionalId),
        error: sendResult.error,
      };
    }
    revalidatePath("/admin/athletes");
    return {
      success: "仮登録を作成し、招待メールを送信しました",
      provisionalId: String(provisionalId),
      inviteUrl: sendResult.inviteUrl,
    };
  }

  revalidatePath("/admin/athletes");
  return {
    success: "アスリートの仮登録を作成しました",
    provisionalId: String(provisionalId),
  };
}

export async function sendInviteForProvisional(
  provisionalId: string
): Promise<{ inviteUrl?: string; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("athlete_provisional_profiles")
    .select("email, full_name, sport")
    .eq("id", provisionalId)
    .maybeSingle();

  if (!profile) return { error: "仮登録が見つかりません" };

  const { data: token, error } = await supabase.rpc("admin_send_athlete_invite", {
    p_provisional_id: provisionalId,
  });

  if (error || !token) {
    return { error: mapRpcError(error?.message ?? "TOKEN_FAILED") };
  }

  const inviteUrl = buildAthleteInviteUrl(String(token));
  const { data: invite } = await supabase
    .from("athlete_invites")
    .select("expires_at")
    .eq("provisional_profile_id", provisionalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const mailResult = await sendAthleteInviteEmail(profile.email, {
    athleteName: profile.full_name,
    sport: profile.sport,
    inviteUrl,
    expiresAt: invite?.expires_at
      ? new Date(String(invite.expires_at)).toLocaleString("ja-JP")
      : "",
  });

  if (!mailResult.ok) {
    return { error: mailResult.error, inviteUrl };
  }

  revalidatePath("/admin/athletes");
  return { inviteUrl };
}

export async function resendAthleteInvite(
  _prev: AdminAthleteFormState | null,
  formData: FormData
): Promise<AdminAthleteFormState> {
  const provisionalId = String(formData.get("provisional_id") ?? "");
  const result = await sendInviteForProvisional(provisionalId);
  if (result.error) {
    return { error: result.error, inviteUrl: result.inviteUrl };
  }
  return { success: "招待メールを再送信しました", inviteUrl: result.inviteUrl };
}

export async function cancelAthleteInvite(
  _prev: AdminAthleteFormState | null,
  formData: FormData
): Promise<AdminAthleteFormState> {
  await requireAdmin();
  const supabase = await createClient();
  const provisionalId = String(formData.get("provisional_id") ?? "");

  const { error } = await supabase.rpc("admin_cancel_athlete_invite", {
    p_provisional_id: provisionalId,
  });

  if (error) return { error: mapRpcError(error.message) };

  revalidatePath("/admin/athletes");
  return { success: "招待を取り消しました" };
}

export async function upsertOrganization(
  _prev: AdminAthleteFormState | null,
  formData: FormData
): Promise<AdminAthleteFormState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { fieldErrors: { name: "組織名を入力してください" } };

  const { error } = await supabase.rpc("admin_upsert_organization", {
    p_id: id,
    p_name: name,
    p_org_type: String(formData.get("org_type") ?? "team") as OrganizationType,
    p_description: String(formData.get("description") ?? ""),
    p_region: String(formData.get("region") ?? ""),
    p_status: String(formData.get("status") ?? "active") as OrganizationStatus,
    p_admin_note: String(formData.get("admin_note") ?? ""),
  });

  if (error) return { error: mapRpcError(error.message) };

  revalidatePath("/admin/organizations");
  return { success: id ? "組織を更新しました" : "組織を登録しました" };
}

export async function updateMembershipStatus(
  _prev: AdminAthleteFormState | null,
  formData: FormData
): Promise<AdminAthleteFormState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_update_organization_membership", {
    p_membership_id: String(formData.get("membership_id") ?? ""),
    p_status: String(formData.get("status") ?? "active") as MembershipStatus,
  });

  if (error) return { error: mapRpcError(error.message) };

  revalidatePath("/admin/organizations");
  revalidatePath("/admin/athletes");
  return { success: "所属ステータスを更新しました" };
}

export async function bulkImportAthletes(
  _prev: BulkImportState | null,
  formData: FormData
): Promise<BulkImportState> {
  await requireAdmin();
  const supabase = await createClient();
  const csvText = String(formData.get("csv") ?? "").trim();

  if (!csvText) return { error: "CSVデータを入力してください" };

  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { error: "ヘッダー行と1件以上のデータが必要です" };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = {
    name: header.indexOf("氏名") >= 0 ? header.indexOf("氏名") : header.indexOf("name"),
    email: header.indexOf("メールアドレス") >= 0 ? header.indexOf("メールアドレス") : header.indexOf("email"),
    sport: header.indexOf("競技") >= 0 ? header.indexOf("競技") : header.indexOf("sport"),
    org: header.indexOf("所属組織") >= 0 ? header.indexOf("所属組織") : header.indexOf("organization"),
    region: header.indexOf("地域") >= 0 ? header.indexOf("地域") : header.indexOf("region"),
  };

  if (idx.name < 0 || idx.email < 0 || idx.sport < 0) {
    return { error: "CSVに氏名・メールアドレス・競技の列が必要です" };
  }

  const orgs = await listOrganizations();
  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const fullName = cols[idx.name] ?? "";
    const email = cols[idx.email] ?? "";
    const sport = cols[idx.sport] ?? "";
    const orgName = idx.org >= 0 ? cols[idx.org] ?? "" : "";
    const region = idx.region >= 0 ? cols[idx.region] ?? "" : "";

    if (!fullName || !email || !sport) {
      errors.push(`行${i + 1}: 必須項目が不足`);
      continue;
    }

    const org = orgs.find((o) => o.name === orgName);

    const { error } = await supabase.rpc("admin_create_provisional_athlete", {
      p_email: email,
      p_full_name: fullName,
      p_sport: sport,
      p_region: region,
      p_organization_id: org?.id ?? null,
      p_review_status: "approved",
      p_is_public: false,
    });

    if (error) {
      errors.push(`行${i + 1}: ${mapRpcError(error.message)}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/admin/athletes");
  return {
    success: `${imported}件の仮登録を作成しました`,
    imported,
    failed: errors.length,
    errors: errors.slice(0, 10),
  };
}

export async function listAllOrganizationMembers(): Promise<
  Record<string, import("@/components/admin/AdminOrganizationMembers").OrganizationMemberRow[]>
> {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("athlete_organization_memberships")
    .select(
      "id, organization_id, membership_status, joined_at, athlete_user_id, provisional_profile_id, profiles(name, email, sport), athlete_provisional_profiles(full_name, email, sport, linked_user_id)"
    )
    .order("joined_at", { ascending: false });

  const grouped: Record<
    string,
    import("@/components/admin/AdminOrganizationMembers").OrganizationMemberRow[]
  > = {};

  for (const row of data ?? []) {
    const orgId = String(row.organization_id);
    const profile = row.profiles as { name?: string; email?: string; sport?: string } | null;
    const provisional = row.athlete_provisional_profiles as {
      full_name?: string;
      email?: string;
      sport?: string;
      linked_user_id?: string | null;
    } | null;

    const member = {
      membershipId: String(row.id),
      membershipStatus: row.membership_status as MembershipStatus,
      joinedAt: String(row.joined_at),
      athleteName: profile?.name ?? provisional?.full_name ?? "（未登録）",
      email: profile?.email ?? provisional?.email ?? "",
      sport: profile?.sport ?? provisional?.sport ?? "",
      linkedUserId: row.athlete_user_id
        ? String(row.athlete_user_id)
        : provisional?.linked_user_id
          ? String(provisional.linked_user_id)
          : null,
      provisionalProfileId: row.provisional_profile_id
        ? String(row.provisional_profile_id)
        : null,
    };

    if (!grouped[orgId]) grouped[orgId] = [];
    grouped[orgId].push(member);
  }

  return grouped;
}

export async function getInviteUrlForProvisional(
  provisionalId: string
): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: token } = await supabase.rpc("admin_send_athlete_invite", {
    p_provisional_id: provisionalId,
  });
  if (!token) return null;
  return buildAthleteInviteUrl(String(token));
}
