import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { fulfillCheckoutSessionPoints } from "@/lib/stripe/fulfill-point-purchase";
import { logWebhook, logWebhookError } from "@/lib/stripe/webhook-log";
import { createClient } from "@/lib/supabase/server";

export async function fulfillCheckoutSessionAfterReturn(
  sessionId: string
): Promise<{
  fulfilled: boolean;
  pointAmount: number | null;
  paymentStatus: string | null;
}> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const pointAmount = Number(session.metadata?.point_amount ?? 0) || null;
    const paymentStatus = session.payment_status;

    if (paymentStatus !== "paid") {
      return { fulfilled: false, pointAmount, paymentStatus };
    }

    const userId = session.metadata?.user_id;
    if (!userId) {
      logWebhook("return fulfillment missing user_id", {
        session_id: sessionId,
        source: "return",
      });
      return { fulfilled: false, pointAmount, paymentStatus };
    }

    const profileClient = await createClient();
    const {
      data: { user },
    } = await profileClient.auth.getUser();
    if (!user || user.id !== userId) {
      logWebhook("return fulfillment user mismatch", {
        session_id: sessionId,
        source: "return",
      });
      return { fulfilled: false, pointAmount, paymentStatus };
    }

    const fulfilled = await fulfillCheckoutSessionPoints(session, "return", {
      userClient: profileClient,
    });
    return { fulfilled, pointAmount, paymentStatus };
  } catch (error) {
    logWebhookError("return fulfillment failed", error, {
      session_id: sessionId,
      source: "return",
    });
    return { fulfilled: false, pointAmount: null, paymentStatus: null };
  }
}

export type { Stripe };
