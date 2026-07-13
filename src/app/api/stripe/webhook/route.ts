import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { getStripeWebhookSecret, stripeSafeLog } from "@/lib/stripe/env";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function isEventProcessed(eventId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", eventId)
    .maybeSingle();
  return Boolean(data);
}

async function markEventProcessed(eventId: string, eventType: string) {
  const supabase = createServiceClient();
  await supabase.from("stripe_webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
  });
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  return (
    subscription.items?.data?.[0]?.current_period_end ??
    ("current_period_end" in subscription
      ? (subscription as Stripe.Subscription & { current_period_end?: number })
          .current_period_end ?? null
      : null)
  );
}

async function recordBillingEvent(input: {
  userId: string | null;
  recordType: "subscription_invoice" | "payment_failed" | "point_purchase" | "refund";
  amountYen: number;
  status: "paid" | "failed" | "refunded" | "pending";
  description: string;
  stripeInvoiceId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!input.userId) return;
  const supabase = createServiceClient();

  if (input.stripeInvoiceId) {
    const { data: existing } = await supabase
      .from("billing_records")
      .select("id")
      .eq("stripe_invoice_id", input.stripeInvoiceId)
      .maybeSingle();
    if (existing) return;
  }

  if (input.stripePaymentIntentId && input.recordType === "payment_failed") {
    const { data: existing } = await supabase
      .from("billing_records")
      .select("id")
      .eq("stripe_payment_intent_id", input.stripePaymentIntentId)
      .eq("record_type", "payment_failed")
      .maybeSingle();
    if (existing) return;
  }

  const { error } = await supabase.from("billing_records").insert({
    user_id: input.userId,
    record_type: input.recordType,
    amount_yen: input.amountYen,
    status: input.status,
    description: input.description,
    stripe_invoice_id: input.stripeInvoiceId ?? null,
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    stripe_charge_id: input.stripeChargeId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }
}

async function fulfillPayment(paymentId: string, session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("payments")
    .select("status")
    .eq("id", paymentId)
    .maybeSingle();

  if (existing?.status === "completed") return;

  await supabase
    .from("payments")
    .update({
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      stripe_customer_id:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null,
    })
    .eq("id", paymentId);

  const { error } = await supabase.rpc("fulfill_stripe_payment", {
    p_payment_id: paymentId,
  });
  if (error) throw new Error(error.message);
}

async function fulfillPaymentByIntent(paymentIntent: Stripe.PaymentIntent) {
  const supabase = createServiceClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, status, user_id, amount_total")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (!payment || payment.status === "completed") {
    if (!payment) {
      const paymentId = paymentIntent.metadata?.payment_id;
      if (paymentId) {
        const { data: byId } = await supabase
          .from("payments")
          .select("id, status")
          .eq("id", paymentId)
          .maybeSingle();
        if (byId?.status === "completed") return;
        if (byId) {
          await supabase
            .from("payments")
            .update({ stripe_payment_intent_id: paymentIntent.id })
            .eq("id", paymentId);
          const { error } = await supabase.rpc("fulfill_stripe_payment", {
            p_payment_id: paymentId,
          });
          if (error) throw new Error(error.message);
        }
      }
    }
    return;
  }

  const { error } = await supabase.rpc("fulfill_stripe_payment", {
    p_payment_id: payment.id,
  });
  if (error) throw new Error(error.message);
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  customerId: string | null
) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const supabase = createServiceClient();
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
    incomplete: "inactive",
    incomplete_expired: "cancelled",
    paused: "inactive",
  };

  const status = statusMap[subscription.status] ?? "inactive";
  const isActive = status === "active" || status === "trialing";
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  await supabase.from("platform_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  await supabase
    .from("profiles")
    .update({ is_supporter: isActive, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

async function markPaymentFailed(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) return;
  const supabase = createServiceClient();
  await supabase
    .from("payments")
    .update({ status: "failed", failure_message: "Payment failed or expired" })
    .eq("id", paymentId)
    .eq("status", "pending");
}

async function markPaymentCancelled(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) return;
  const supabase = createServiceClient();
  await supabase
    .from("payments")
    .update({ status: "cancelled" })
    .eq("id", paymentId)
    .eq("status", "pending");
}

async function markPaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = createServiceClient();
  const userId = paymentIntent.metadata?.user_id ?? null;

  if (paymentIntent.id) {
    await supabase
      .from("payments")
      .update({
        status: "failed",
        failure_message: paymentIntent.last_payment_error?.message ?? "Payment failed",
      })
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .eq("status", "pending");
  }

  const paymentId = paymentIntent.metadata?.payment_id;
  if (paymentId) {
    await supabase
      .from("payments")
      .update({
        status: "failed",
        failure_message: paymentIntent.last_payment_error?.message ?? "Payment failed",
      })
      .eq("id", paymentId)
      .eq("status", "pending");
  }

  await recordBillingEvent({
    userId,
    recordType: "payment_failed",
    amountYen: paymentIntent.amount ?? 0,
    status: "failed",
    description: paymentIntent.last_payment_error?.message ?? "決済に失敗しました",
    stripePaymentIntentId: paymentIntent.id,
    metadata: { payment_id: paymentId },
  });
}

async function refundPaymentByIntent(paymentIntentId: string) {
  const supabase = createServiceClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, user_id, amount_total")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (!payment?.id) return;

  const { error } = await supabase.rpc("refund_stripe_payment", {
    p_payment_id: payment.id,
  });
  if (error) throw new Error(error.message);

  await recordBillingEvent({
    userId: payment.user_id,
    recordType: "refund",
    amountYen: payment.amount_total,
    status: "refunded",
    description: "ポイント購入の返金",
    stripePaymentIntentId: paymentIntentId,
  });
}

async function recordSubscriptionInvoice(invoice: Stripe.Invoice) {
  const userId = invoice.parent?.subscription_details?.metadata?.user_id
    ?? (typeof invoice.customer === "object" && invoice.customer && "metadata" in invoice.customer
      ? (invoice.customer as Stripe.Customer).metadata?.user_id
      : null);

  let resolvedUserId = userId ?? null;
  if (!resolvedUserId && invoice.customer) {
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
    const supabase = createServiceClient();
    const { data: sub } = await supabase
      .from("platform_subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    resolvedUserId = sub?.user_id ?? null;
  }

  await recordBillingEvent({
    userId: resolvedUserId,
    recordType: "subscription_invoice",
    amountYen: invoice.amount_paid ?? 0,
    status: invoice.status === "paid" ? "paid" : "pending",
    description: "TGPLUSサポーター 月額請求",
    stripeInvoiceId: invoice.id,
    metadata: { subscription_id: getInvoiceSubscriptionId(invoice) },
  });
}

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (await isEventProcessed(event.id)) {
    stripeSafeLog("duplicate webhook event", { event_id: event.id, type: event.type });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await getStripe().subscriptions.retrieve(subId);
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id ?? null;
          await syncSubscription(subscription, customerId);
        } else if (session.payment_status === "paid") {
          const paymentId = session.metadata?.payment_id;
          if (paymentId) await fulfillPayment(paymentId, session);
        }
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await fulfillPaymentByIntent(paymentIntent);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await markPaymentIntentFailed(paymentIntent);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordSubscriptionInvoice(invoice);
        const subId = getInvoiceSubscriptionId(invoice);
        if (subId) {
          const subscription = await getStripe().subscriptions.retrieve(subId);
          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id ?? null;
          await syncSubscription(subscription, customerId);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = getInvoiceSubscriptionId(invoice);
        if (subId) {
          const subscription = await getStripe().subscriptions.retrieve(subId);
          await syncSubscription(subscription, null);
        }
        let userId: string | null = null;
        if (invoice.customer) {
          const customerId =
            typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
          const supabase = createServiceClient();
          const { data: sub } = await supabase
            .from("platform_subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          userId = sub?.user_id ?? null;
        }
        await recordBillingEvent({
          userId,
          recordType: "payment_failed",
          amountYen: invoice.amount_due ?? 0,
          status: "failed",
          description: "サブスクリプション請求に失敗しました",
          stripeInvoiceId: invoice.id,
          metadata: { subscription_id: subId },
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id ?? null;
        await syncSubscription(subscription, customerId);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription, null);
        break;
      }
      case "checkout.session.expired": {
        await markPaymentCancelled(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "checkout.session.async_payment_failed": {
        await markPaymentFailed(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (paymentIntentId) await refundPaymentByIntent(paymentIntentId);
        break;
      }
      default:
        break;
    }

    await markEventProcessed(event.id, event.type);
    stripeSafeLog("webhook processed", { type: event.type, event_id: event.id });
  } catch (error) {
    stripeSafeLog("webhook handler error", {
      type: event.type,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
