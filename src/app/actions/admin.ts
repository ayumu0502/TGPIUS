"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminActionState,
  AdminAthleteEarning,
  AdminBillingRecord,
  AdminGift,
  AdminPayment,
  AdminPointPurchase,
  AdminStats,
  AdminUser,
} from "@/types/admin";
import type { AccountType } from "@/types/auth";

const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  NOT_ADMIN: "管理者権限がありません",
  CANNOT_SUSPEND_SELF: "自分自身のアカウントは停止できません",
  CANNOT_SUSPEND_ADMIN: "管理者アカウントは停止できません",
  USER_NOT_FOUND: "ユーザーが見つかりません",
};

function translateAdminError(message: string): string {
  for (const [code, text] of Object.entries(ADMIN_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  return "操作に失敗しました";
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_admin) {
    redirect(`/${profile.account_type}/dashboard`);
  }
  return profile;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.is_admin === true;
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const supabase = await createClient();

  const [profilesRes, giftsRes, purchasesRes, paymentsRes, billingRes, giftAmountRes] =
    await Promise.all([
    supabase.from("profiles").select("account_type"),
    supabase.from("gifts").select("id", { count: "exact", head: true }),
    supabase.from("point_transactions").select("id", { count: "exact", head: true }),
    supabase
      .from("payments")
      .select("amount_total, platform_fee, net_amount, status"),
    supabase
      .from("billing_records")
      .select("record_type, amount_yen, status"),
    supabase.from("gifts").select("amount"),
  ]);

  const profiles = profilesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const billing = billingRes.error ? [] : (billingRes.data ?? []);
  const giftAmounts = giftAmountRes.data ?? [];
  const completedPayments = payments.filter((p) => p.status === "completed");

  const athleteCount = profiles.filter((p) => p.account_type === "athlete").length;
  const sponsorCount = profiles.filter((p) => p.account_type === "sponsor").length;
  const fanCount = profiles.filter((p) => p.account_type === "fan").length;

  const totalRevenue = completedPayments.reduce(
    (sum, row) => sum + Number(row.amount_total),
    0
  );
  const platformFeeTotal = completedPayments.reduce(
    (sum, row) => sum + Number(row.platform_fee),
    0
  );
  const netRevenue = completedPayments.reduce(
    (sum, row) => sum + Number(row.net_amount),
    0
  );

  const giftRevenue = giftAmounts.reduce((sum, row) => sum + Number(row.amount), 0);
  const subscriptionRevenue = billing
    .filter((r) => r.record_type === "subscription_invoice" && r.status === "paid")
    .reduce((sum, row) => sum + Number(row.amount_yen), 0);
  const failedPaymentCount = billing.filter(
    (r) => r.record_type === "payment_failed" || r.status === "failed"
  ).length;
  const refundTotal = billing
    .filter((r) => r.record_type === "refund")
    .reduce((sum, row) => sum + Number(row.amount_yen), 0);

  return {
    totalUsers: profiles.length,
    athleteCount,
    sponsorCount,
    fanCount,
    totalRevenue,
    platformFeeTotal,
    netRevenue,
    giftCount: giftsRes.count ?? 0,
    purchaseCount: purchasesRes.count ?? 0,
    giftRevenue,
    subscriptionRevenue,
    failedPaymentCount,
    refundTotal,
  };
}

function mapAdminUser(row: Record<string, unknown>): AdminUser {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    account_type: row.account_type as AccountType,
    is_suspended: Boolean(row.is_suspended),
    is_admin: Boolean(row.is_admin),
    point_balance: Number(row.point_balance ?? 0),
    created_at: String(row.created_at ?? ""),
  };
}

export async function getRecentUsers(limit = 10): Promise<AdminUser[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, name, email, account_type, is_suspended, is_admin, point_balance, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapAdminUser);
}

export async function searchUsers(query: string): Promise<AdminUser[]> {
  await requireAdmin();
  const trimmed = query.trim();
  if (!trimmed) return getRecentUsers(20);

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, name, email, account_type, is_suspended, is_admin, point_balance, created_at"
    )
    .or(`name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []).map(mapAdminUser);
}

export async function getRecentPointPurchases(
  limit = 10
): Promise<AdminPointPurchase[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("point_transactions")
    .select("id, amount, payment_method, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((row) => String(row.user_id)))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [String(p.id), p])
  );

  return data.map((row) => {
    const profile = profileMap.get(String(row.user_id));
    return {
      id: String(row.id),
      user_name: String(profile?.name ?? "不明"),
      user_email: String(profile?.email ?? ""),
      amount: Number(row.amount),
      payment_method: String(row.payment_method ?? "test"),
      created_at: String(row.created_at),
    };
  });
}

export async function getRecentSales(limit = 10): Promise<AdminPayment[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("payments")
    .select(
      "id, point_amount, amount_total, platform_fee, net_amount, status, payment_method, created_at, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((row) => String(row.user_id)))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [String(p.id), p])
  );

  return data.map((row) => {
    const profile = profileMap.get(String(row.user_id));
    return {
      id: String(row.id),
      user_name: String(profile?.name ?? "不明"),
      user_email: String(profile?.email ?? ""),
      point_amount: Number(row.point_amount),
      amount_total: Number(row.amount_total),
      platform_fee: Number(row.platform_fee),
      net_amount: Number(row.net_amount),
      status: String(row.status),
      payment_method: String(row.payment_method ?? "stripe"),
      created_at: String(row.created_at),
    };
  });
}

export async function getRecentGifts(limit = 10): Promise<AdminGift[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("gifts")
    .select("id, sender_id, receiver_id, amount, message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const profileIds = [
    ...new Set([
      ...data.map((row) => String(row.sender_id)),
      ...data.map((row) => String(row.receiver_id)),
    ]),
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [String(p.id), String(p.name ?? "不明")])
  );

  return data.map((row) => ({
    id: String(row.id),
    sender_name: profileMap.get(String(row.sender_id)) ?? "不明",
    receiver_name: profileMap.get(String(row.receiver_id)) ?? "不明",
    amount: Number(row.amount),
    message: String(row.message ?? ""),
    created_at: String(row.created_at),
  }));
}

export async function broadcastAdminAnnouncement(
  _prevState: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "/notifications").trim();

  if (!title) {
    return { error: "タイトルを入力してください" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_broadcast_announcement", {
    p_title: title,
    p_body: body,
    p_link_url: linkUrl || "/notifications",
  });

  if (error) {
    return { error: translateAdminError(error.message) };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/notifications");

  return {
    success: `${data ?? 0}件のユーザーにお知らせを送信しました`,
  };
}

export async function setUserSuspended(
  _prevState: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const userId = String(formData.get("user_id") ?? "").trim();
  const suspended = String(formData.get("suspended") ?? "") === "true";

  if (!userId) {
    return { error: "ユーザーが指定されていません" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_suspended", {
    p_user_id: userId,
    p_suspended: suspended,
  });

  if (error) {
    return { error: translateAdminError(error.message) };
  }

  revalidatePath("/admin/dashboard");

  return {
    success: suspended
      ? "ユーザーを停止しました"
      : "ユーザーを再開しました",
  };
}

export async function getPendingPayouts() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("payout_requests")
    .select("id, user_id, amount, status, created_at, profiles(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    amount: Number(row.amount),
    status: "pending" as const,
    stripe_transfer_id: null,
    admin_note: null,
    created_at: String(row.created_at),
    processed_at: null,
    athlete_name:
      row.profiles && typeof row.profiles === "object" && "name" in row.profiles
        ? String((row.profiles as { name: string }).name)
        : undefined,
  }));
}

export async function getSubscriptionStats() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("platform_subscriptions").select("status");
  const rows = data ?? [];
  return {
    activeCount: rows.filter((r) => r.status === "active" || r.status === "trialing").length,
    totalCount: rows.length,
  };
}

export async function getFailedBillingRecords(limit = 10): Promise<AdminBillingRecord[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("billing_records")
    .select("id, user_id, record_type, amount_yen, status, description, created_at")
    .in("status", ["failed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((r) => String(r.user_id)))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", userIds);
  const profileMap = new Map(
    (profiles ?? []).map((p) => [String(p.id), String(p.name ?? "不明")])
  );

  return data.map((row) => ({
    id: String(row.id),
    user_name: profileMap.get(String(row.user_id)) ?? "不明",
    record_type: String(row.record_type),
    amount_yen: Number(row.amount_yen),
    status: String(row.status),
    description: String(row.description ?? ""),
    created_at: String(row.created_at),
  }));
}

export async function getAthleteEarningsBreakdown(
  limit = 15
): Promise<AdminAthleteEarning[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: ledger } = await supabase
    .from("athlete_earnings_ledger")
    .select("athlete_id, source_type, net_amount, gross_amount")
    .eq("source_type", "gift")
    .eq("status", "settled");

  if (!ledger || ledger.length === 0) {
    const { data: gifts } = await supabase.from("gifts").select("receiver_id, amount");
    const byAthlete = new Map<string, { net: number; count: number }>();
    for (const gift of gifts ?? []) {
      const id = String(gift.receiver_id);
      const net = Math.floor(Number(gift.amount) * 0.9);
      const current = byAthlete.get(id) ?? { net: 0, count: 0 };
      byAthlete.set(id, { net: current.net + net, count: current.count + 1 });
    }
    const athleteIds = [...byAthlete.keys()].slice(0, limit);
    if (athleteIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", athleteIds);
    const profileMap = new Map(
      (profiles ?? []).map((p) => [String(p.id), String(p.name ?? "不明")])
    );

    return athleteIds.map((id) => {
      const stats = byAthlete.get(id)!;
      return {
        athlete_id: id,
        athlete_name: profileMap.get(id) ?? "不明",
        gift_net: stats.net,
        gift_count: stats.count,
        total_earnings: stats.net,
      };
    });
  }

  const byAthlete = new Map<string, { net: number; count: number }>();
  for (const row of ledger) {
    const id = String(row.athlete_id);
    const current = byAthlete.get(id) ?? { net: 0, count: 0 };
    byAthlete.set(id, {
      net: current.net + Number(row.net_amount),
      count: current.count + 1,
    });
  }

  const sorted = [...byAthlete.entries()]
    .sort((a, b) => b[1].net - a[1].net)
    .slice(0, limit);

  const athleteIds = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", athleteIds);
  const profileMap = new Map(
    (profiles ?? []).map((p) => [String(p.id), String(p.name ?? "不明")])
  );

  return sorted.map(([id, stats]) => ({
    athlete_id: id,
    athlete_name: profileMap.get(id) ?? "不明",
    gift_net: stats.net,
    gift_count: stats.count,
    total_earnings: stats.net,
  }));
}
