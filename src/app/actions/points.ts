"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PURCHASE_AMOUNTS,
  type PointPurchaseState,
  type PointTransaction,
  type PurchaseAmount,
} from "@/types/points";

const PURCHASE_ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "ログインが必要です",
  INVALID_AMOUNT: "購入プランが正しくありません",
  NOT_FAN: "ファンアカウントのみポイントを購入できます",
};

function translatePurchaseError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("purchase_points") ||
    lower.includes("point_transactions") ||
    lower.includes("could not find the function") ||
    lower.includes("schema cache")
  ) {
    return "Supabase で points-schema.sql / stripe-schema.sql が未実行です。SQL Editor から実行してください";
  }

  for (const [code, text] of Object.entries(PURCHASE_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }

  return "ポイントの購入に失敗しました";
}

function isPurchaseAmount(value: number): value is PurchaseAmount {
  return PURCHASE_AMOUNTS.includes(value as PurchaseAmount);
}

export async function getPurchaseHistory(): Promise<PointTransaction[]> {
  const current = await getCurrentProfile();
  if (!current || current.account_type !== "fan") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("point_transactions")
    .select(
      "id, amount, transaction_type, payment_method, created_at, payment_id, payments(amount_total, status)"
    )
    .eq("user_id", current.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const payment = Array.isArray(row.payments)
      ? row.payments[0]
      : row.payments;

    return {
      id: String(row.id),
      amount: row.amount as PurchaseAmount,
      transaction_type: "purchase",
      payment_method: row.payment_method as PointTransaction["payment_method"],
      created_at: String(row.created_at),
      amount_yen: payment?.amount_total ?? null,
      payment_status: payment?.status ?? null,
    };
  });
}

export async function purchasePoints(
  _prevState: PointPurchaseState | null,
  formData: FormData
): Promise<PointPurchaseState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };
  if (current.account_type !== "fan") {
    return { error: "ファンアカウントのみポイントを購入できます" };
  }

  const amountValue = Number(formData.get("amount"));

  if (!isPurchaseAmount(amountValue)) {
    return { fieldErrors: { amount: "購入プランを選択してください" } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("purchase_points", {
    p_amount: amountValue,
  });

  if (error) {
    return { error: translatePurchaseError(error.message) };
  }

  if (!data) {
    return { error: "ポイントの購入に失敗しました" };
  }

  revalidatePath("/points/purchase");
  revalidatePath("/fan/dashboard");
  revalidatePath("/fan/gifts");

  return {
    success: `${amountValue.toLocaleString("ja-JP")} pt を購入しました`,
  };
}
