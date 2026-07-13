"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { getAppUrl, getSupporterPriceId, SUPPORTER_PLAN } from "@/lib/stripe/plans";
import { createServiceClient } from "@/lib/supabase/admin";
import type { BillingRecord, SubscriptionState } from "@/types/subscription";

async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: { user_id: userId },
  });

  await supabase.from("stripe_customers").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return customer.id;
}

export async function createSupporterCheckout(): Promise<SubscriptionState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };
  if (current.account_type !== "fan") {
    return { error: "ファンアカウントのみサポータープランに加入できます" };
  }
  if (!isStripeConfigured()) {
    return { error: "Stripe が未設定です" };
  }

  const priceId = getSupporterPriceId();
  if (!priceId) {
    return {
      error:
        "STRIPE_SUPPORTER_PRICE_ID が未設定です。Stripe Dashboard で Price を作成してください",
    };
  }

  const supabase = createServiceClient();
  const customerId = await getOrCreateStripeCustomer(
    current.id,
    current.email,
    current.name
  );

  const appUrl = getAppUrl();
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      user_id: current.id,
      plan: "tgplus_supporter",
    },
    subscription_data: {
      metadata: { user_id: current.id, plan: "tgplus_supporter" },
    },
    success_url: `${appUrl}/supporter/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/supporter`,
  });

  if (!session.url) return { error: "Checkout URL の取得に失敗しました" };
  redirect(session.url);
}

export async function createSupporterPortal(): Promise<SubscriptionState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "ログインが必要です" };

  if (!isStripeConfigured()) return { error: "Stripe が未設定です" };

  const supabase = createServiceClient();
  const { data: sub } = await supabase
    .from("platform_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", current.id)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const { data: customer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", current.id)
      .maybeSingle();
    customerId = customer?.stripe_customer_id ?? null;
  }

  if (!customerId) return { error: "有効なサブスクリプションが見つかりません" };

  const portal = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/supporter`,
  });

  redirect(portal.url);
}

export async function getSupporterStatus(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("platform_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    subscription: data,
    plan: SUPPORTER_PLAN,
  };
}

export async function getSupporterBillingHistory(
  userId: string,
  limit = 20
): Promise<BillingRecord[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("billing_records")
    .select(
      "id, record_type, amount_yen, status, description, stripe_invoice_id, created_at"
    )
    .eq("user_id", userId)
    .in("record_type", ["subscription_invoice", "payment_failed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data ?? []).map((row) => ({
    id: String(row.id),
    record_type: row.record_type as BillingRecord["record_type"],
    amount_yen: Number(row.amount_yen),
    status: row.status as BillingRecord["status"],
    description: String(row.description ?? ""),
    stripe_invoice_id: row.stripe_invoice_id ? String(row.stripe_invoice_id) : null,
    created_at: String(row.created_at),
  }));
}
