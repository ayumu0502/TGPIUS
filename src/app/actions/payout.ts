"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import type { PayoutState } from "@/types/subscription";

export async function requestPayout(
  _prev: PayoutState | null,
  formData: FormData
): Promise<PayoutState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };
  if (current.account_type !== "athlete") {
    return { error: "アスリートのみ出金申請できます" };
  }

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount < 1000) {
    return { error: "最低出金額は1,000ポイントです" };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("request_payout", { p_amount: amount });
  if (error) {
    if (error.message.includes("INSUFFICIENT_EARNINGS")) {
      return { error: "売上残高が不足しています" };
    }
    return { error: "出金申請に失敗しました" };
  }

  revalidatePath("/athlete/dashboard");
  revalidatePath("/athlete/earnings");
  revalidatePath("/admin/dashboard");

  return {
    success:
      "出金申請を受け付けました。運営が確認後、登録口座へ振込します。",
  };
}

export async function approvePayoutRequest(
  requestId: string
): Promise<{ error?: string; success?: string }> {
  const current = await getCurrentProfile();
  if (!current?.is_admin) return { error: "権限がありません" };

  const supabase = createServiceClient();
  const { data: request } = await supabase
    .from("payout_requests")
    .select("id, amount, user_id, status")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (!request) return { error: "出金申請が見つかりません" };

  const { error: updateError } = await supabase
    .from("payout_requests")
    .update({
      status: "completed",
      admin_note: "運営により銀行振込処理済み",
      processed_by: current.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) return { error: "出金承認の更新に失敗しました" };

  await supabase.from("athlete_earnings_ledger").insert({
    athlete_id: request.user_id,
    source_type: "payout",
    source_id: request.id,
    gross_amount: request.amount,
    platform_fee: 0,
    net_amount: request.amount,
    status: "settled",
    description: "出金完了（運営振込）",
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/athlete/earnings");

  return {
    success:
      "出金を承認しました。Stripe残高から運営口座へ入金後、登録銀行口座からアスリートへ振込してください。",
  };
}

export async function rejectPayoutRequest(
  requestId: string,
  note?: string
): Promise<{ error?: string; success?: string }> {
  const current = await getCurrentProfile();
  if (!current?.is_admin) return { error: "権限がありません" };

  const supabase = createServiceClient();
  const { data: request } = await supabase
    .from("payout_requests")
    .select("amount, user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request || request.status !== "pending") {
    return { error: "出金申請が見つかりません" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("earnings_balance")
    .eq("id", request.user_id)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ earnings_balance: profile.earnings_balance + request.amount })
      .eq("id", request.user_id);
  }

  await supabase
    .from("payout_requests")
    .update({
      status: "rejected",
      admin_note: note ?? "運営により却下",
      processed_by: current.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  revalidatePath("/admin/dashboard");
  revalidatePath("/athlete/earnings");

  return { success: "出金申請を却下し、残高を返却しました" };
}
