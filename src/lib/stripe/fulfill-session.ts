import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { canUseStripePaymentRecords } from "@/lib/stripe/checkout-capabilities";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import {
  getProcessedStripeSession,
  markStripeSessionProcessed,
} from "@/lib/stripe/session-idempotency";
import { getStripeSupabase, hasServiceRoleKey } from "@/lib/supabase/stripe-db";

async function syncPaymentFromSession(
  paymentId: string,
  session: Stripe.Checkout.Session
) {
  const { client: supabase } = await getStripeSupabase();
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
      stripe_checkout_session_id: session.id,
    })
    .eq("id", paymentId);
}

async function fulfillViaPaymentRecord(
  paymentId: string,
  session: Stripe.Checkout.Session
): Promise<boolean> {
  if (hasServiceRoleKey()) {
    await syncPaymentFromSession(paymentId, session);
  }

  const { client: supabase } = await getStripeSupabase();
  const rpcName = hasServiceRoleKey()
    ? "fulfill_stripe_payment"
    : "fulfill_stripe_payment_for_user";
  const { error } = await supabase.rpc(rpcName, {
    p_payment_id: paymentId,
  });

  return !error;
}

async function fulfillViaDirectPurchase(
  session: Stripe.Checkout.Session,
  userId: string,
  pointAmount: number
): Promise<boolean> {
  const processed = await getProcessedStripeSession(session.id);
  if (processed) {
    return processed.userId === userId;
  }

  const supabase = await createClient();
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingPayment?.status === "completed") {
    await markStripeSessionProcessed(session.id, userId, pointAmount);
    return true;
  }

  const { error } = await supabase.rpc("purchase_points", {
    p_amount: pointAmount,
  });

  if (error) {
    return false;
  }

  await markStripeSessionProcessed(session.id, userId, pointAmount);
  return true;
}

export async function fulfillCheckoutSessionAfterReturn(
  sessionId: string
): Promise<{
  fulfilled: boolean;
  pointAmount: number | null;
  paymentStatus: string | null;
}> {
  if (!isStripeConfigured()) {
    return { fulfilled: false, pointAmount: null, paymentStatus: null };
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const pointAmount = Number(session.metadata?.point_amount ?? 0) || null;
    const paymentStatus = session.payment_status;

    if (paymentStatus !== "paid") {
      return { fulfilled: false, pointAmount, paymentStatus };
    }

    const userId = session.metadata?.user_id;
    if (!userId) {
      return { fulfilled: false, pointAmount, paymentStatus };
    }

    const profileClient = await createClient();
    const {
      data: { user },
    } = await profileClient.auth.getUser();
    if (!user || user.id !== userId) {
      return { fulfilled: false, pointAmount, paymentStatus };
    }

    const paymentId = session.metadata?.payment_id;
    const checkoutMode = session.metadata?.checkout_mode ?? "payment_record";

    if (
      paymentId &&
      checkoutMode === "payment_record" &&
      (await canUseStripePaymentRecords())
    ) {
      const fulfilled = await fulfillViaPaymentRecord(paymentId, session);
      return { fulfilled, pointAmount, paymentStatus };
    }

    if (!pointAmount) {
      return { fulfilled: false, pointAmount, paymentStatus };
    }

    const fulfilled = await fulfillViaDirectPurchase(session, userId, pointAmount);
    return { fulfilled, pointAmount, paymentStatus };
  } catch {
    return { fulfilled: false, pointAmount: null, paymentStatus: null };
  }
}
