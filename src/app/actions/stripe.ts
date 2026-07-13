"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getStripe } from "@/lib/stripe/client";
import { getStripeCheckoutStatus } from "@/lib/stripe/config";
import {
  calculateNetAmount,
  calculatePlatformFee,
  getAppUrl,
  POINT_PLANS,
} from "@/lib/stripe/plans";
import { canUseStripePaymentRecords } from "@/lib/stripe/checkout-capabilities";
import { getStripeSupabase } from "@/lib/supabase/stripe-db";
import {
  PURCHASE_AMOUNTS,
  type PointPurchaseState,
  type PurchaseAmount,
} from "@/types/points";

function isPurchaseAmount(value: number): value is PurchaseAmount {
  return PURCHASE_AMOUNTS.includes(value as PurchaseAmount);
}

async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const { client: supabase, mode } = await getStripeSupabase();

  const { data: existing } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { user_id: userId },
  });

  if (mode === "service") {
    await supabase.from("stripe_customers").upsert(
      {
        user_id: userId,
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } else {
    const { error } = await supabase.rpc("link_stripe_customer", {
      p_stripe_customer_id: customer.id,
    });
    if (error && !error.message.toLowerCase().includes("could not find the function")) {
      throw new Error(error.message);
    }
  }

  return customer.id;
}

async function createPendingPayment(
  userId: string,
  plan: (typeof POINT_PLANS)[PurchaseAmount],
  platformFee: number,
  netAmount: number
): Promise<string> {
  const { client: supabase, mode } = await getStripeSupabase();
  const metadata = {
    plan_label: plan.label,
    platform_fee_rate: process.env.STRIPE_PLATFORM_FEE_RATE ?? "0.1",
  };

  if (mode === "service") {
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        point_amount: plan.points,
        amount_total: plan.yen,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: "pending",
        payment_method: "stripe",
        metadata,
      })
      .select("id")
      .single();

    if (error || !payment) {
      throw new Error(error?.message ?? "PAYMENT_INSERT_FAILED");
    }
    return payment.id;
  }

  const { data: paymentId, error } = await supabase.rpc("init_stripe_payment", {
    p_point_amount: plan.points,
    p_amount_total: plan.yen,
    p_platform_fee: platformFee,
    p_net_amount: netAmount,
    p_metadata: metadata,
  });

  if (error || !paymentId) {
    throw new Error(error?.message ?? "PAYMENT_RPC_FAILED");
  }

  return String(paymentId);
}

async function attachCheckoutSession(
  paymentId: string,
  sessionId: string
): Promise<void> {
  const { client: supabase, mode } = await getStripeSupabase();

  if (mode === "service") {
    await supabase
      .from("payments")
      .update({ stripe_checkout_session_id: sessionId })
      .eq("id", paymentId);
    return;
  }

  const { error } = await supabase.rpc("update_stripe_payment_session", {
    p_payment_id: paymentId,
    p_checkout_session_id: sessionId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function markPaymentFailed(paymentId: string): Promise<void> {
  const { client: supabase, mode } = await getStripeSupabase();

  if (mode === "service") {
    await supabase
      .from("payments")
      .update({
        status: "failed",
        failure_message: "Checkout creation failed",
      })
      .eq("id", paymentId);
    return;
  }

  await supabase.rpc("mark_stripe_payment_failed", {
    p_payment_id: paymentId,
    p_failure_message: "Checkout creation failed",
  });
}

export async function createCheckoutSession(
  _prevState: PointPurchaseState | null,
  formData: FormData
): Promise<PointPurchaseState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };
  if (current.account_type !== "fan") {
    return { error: "ファンアカウントのみポイントを購入できます" };
  }

  const stripeStatus = getStripeCheckoutStatus();
  if (!stripeStatus.ready) {
    return { error: stripeStatus.message ?? "Stripe の設定が完了していません" };
  }

  const amountValue = Number(formData.get("amount"));
  if (!isPurchaseAmount(amountValue)) {
    return { fieldErrors: { amount: "購入プランを選択してください" } };
  }

  const plan = POINT_PLANS[amountValue];
  const platformFee = calculatePlatformFee(plan.yen);
  const netAmount = calculateNetAmount(plan.yen);

  const usePaymentRecords = await canUseStripePaymentRecords();
  let paymentId: string | null = null;

  if (usePaymentRecords) {
    try {
      paymentId = await createPendingPayment(
        current.id,
        plan,
        platformFee,
        netAmount
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (
        message.includes("payments") ||
        message.includes("init_stripe_payment") ||
        message.includes("could not find")
      ) {
        return {
          error:
            "Supabase で stripe-schema.sql / stripe-checkout-user-rpc.sql が未実行です。SQL Editor から実行するか、SUPABASE_SERVICE_ROLE_KEY を設定してください",
        };
      }
      return { error: "決済の準備に失敗しました" };
    }
  }

  let checkoutUrl: string;

  try {
    const stripeCustomerId = await getOrCreateStripeCustomer(
      current.id,
      current.email,
      current.name
    );

    const stripe = getStripe();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      payment_method_types: ["card"],
      payment_method_options: {
        card: { request_three_d_secure: "automatic" },
      },
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `${plan.points.toLocaleString("ja-JP")}ポイント`,
              description: `TGPLUS ポイント（${plan.label}）· 決済金額 ${plan.yen.toLocaleString("ja-JP")}円`,
            },
            unit_amount: plan.yen,
          },
          quantity: 1,
        },
      ],
      metadata: {
        ...(paymentId ? { payment_id: paymentId } : {}),
        user_id: current.id,
        point_amount: String(plan.points),
        amount_total: String(plan.yen),
        platform_fee: String(platformFee),
        net_amount: String(netAmount),
        checkout_mode: paymentId ? "payment_record" : "direct_fulfill",
      },
      success_url: `${appUrl}/points/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/points/purchase/cancel`,
    });

    if (paymentId) {
      await attachCheckoutSession(paymentId, session.id);
    }

    if (!session.url) {
      return { error: "Checkout URL の取得に失敗しました" };
    }

    checkoutUrl = session.url;
  } catch {
    if (paymentId) {
      await markPaymentFailed(paymentId);
    }
    return {
      error:
        "Stripe Checkout の開始に失敗しました。設定を確認して再度お試しください。",
    };
  }

  redirect(checkoutUrl);
}
