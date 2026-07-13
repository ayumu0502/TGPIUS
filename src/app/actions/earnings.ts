"use server";

import { getCurrentProfile } from "@/app/actions/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import type { AthleteEarningsSummary, PayoutRequest } from "@/types/subscription";

export async function getAthleteEarningsSummary(
  athleteId: string
): Promise<AthleteEarningsSummary> {
  const supabase = createServiceClient();

  const [ledgerRes, profileRes, payoutRes] = await Promise.all([
    supabase
      .from("athlete_earnings_ledger")
      .select("source_type, gross_amount, net_amount, status")
      .eq("athlete_id", athleteId),
    supabase
      .from("profiles")
      .select("earnings_balance")
      .eq("id", athleteId)
      .single(),
    supabase
      .from("payout_requests")
      .select("amount, status")
      .eq("user_id", athleteId),
  ]);

  const ledger = ledgerRes.data ?? [];
  const payouts = payoutRes.data ?? [];

  const giftRows = ledger.filter((r) => r.source_type === "gift" && r.status === "settled");
  const giftGross = giftRows.reduce((sum, r) => sum + Number(r.gross_amount), 0);
  const giftNet = giftRows.reduce((sum, r) => sum + Number(r.net_amount), 0);
  const giftCount = giftRows.length;

  const subscriptionNet = ledger
    .filter((r) => r.source_type === "subscription" && r.status === "settled")
    .reduce((sum, r) => sum + Number(r.net_amount), 0);

  const pendingPayout = payouts
    .filter((r) => r.status === "pending" || r.status === "approved" || r.status === "processing")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const settledPayout = payouts
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalEarnings = giftNet + subscriptionNet;
  const availableBalance = Number(profileRes.data?.earnings_balance ?? 0);

  return {
    giftGross,
    giftNet,
    giftCount,
    subscriptionNet,
    totalEarnings,
    availableBalance,
    pendingPayout,
    settledPayout,
  };
}

export async function getAthletePayoutHistory(
  athleteId: string,
  limit = 20
): Promise<PayoutRequest[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("payout_requests")
    .select("id, user_id, amount, status, stripe_transfer_id, admin_note, created_at, processed_at")
    .eq("user_id", athleteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    amount: Number(row.amount),
    status: row.status as PayoutRequest["status"],
    stripe_transfer_id: row.stripe_transfer_id ? String(row.stripe_transfer_id) : null,
    admin_note: row.admin_note ? String(row.admin_note) : null,
    created_at: String(row.created_at),
    processed_at: row.processed_at ? String(row.processed_at) : null,
  }));
}

export async function getCurrentAthleteEarnings(): Promise<{
  summary: AthleteEarningsSummary | null;
  payouts: PayoutRequest[];
}> {
  const current = await getCurrentProfile();
  if (!current || current.account_type !== "athlete") {
    return { summary: null, payouts: [] };
  }

  const [summary, payouts] = await Promise.all([
    getAthleteEarningsSummary(current.id),
    getAthletePayoutHistory(current.id),
  ]);

  return { summary, payouts };
}
