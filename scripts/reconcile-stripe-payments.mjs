/**
 * Reconcile paid Stripe Checkout sessions with Supabase point balances.
 * Does not print secrets or PII.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!stripeKey || !supabaseUrl || !serviceKey) {
  console.error("Missing STRIPE_SECRET_KEY, Supabase URL, or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fulfillPaymentRecord(paymentId, session) {
  const { data: existing } = await supabase
    .from("payments")
    .select("status, user_id, point_amount")
    .eq("id", paymentId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, reason: "payment_not_found" };
  }
  if (existing.status === "completed") {
    return { ok: true, reason: "already_completed", userId: existing.user_id };
  }

  await supabase
    .from("payments")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
    })
    .eq("id", paymentId);

  const { error } = await supabase.rpc("fulfill_stripe_payment", {
    p_payment_id: paymentId,
  });

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true, reason: "fulfilled", userId: existing.user_id };
}

async function fulfillSessionMetadata(session) {
  const userId = session.metadata?.user_id;
  const pointAmount = Number(session.metadata?.point_amount ?? 0);
  const amountTotal = Number(session.metadata?.amount_total ?? pointAmount);

  if (!userId || !pointAmount) {
    return { ok: false, reason: "missing_metadata" };
  }

  const { data: paymentId, error } = await supabase.rpc(
    "fulfill_stripe_session_metadata",
    {
      p_checkout_session_id: session.id,
      p_user_id: userId,
      p_point_amount: pointAmount,
      p_amount_total: amountTotal,
      p_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      p_stripe_customer_id:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null,
    }
  );

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true, reason: "metadata_fulfilled", userId, paymentId };
}

async function main() {
  const sessions = await stripe.checkout.sessions.list({
    limit: 10,
    status: "complete",
  });

  console.log(`Found ${sessions.data.length} completed checkout sessions`);

  for (const session of sessions.data) {
    if (session.mode !== "payment" || session.payment_status !== "paid") continue;

    const paymentId = session.metadata?.payment_id;
    let result;

    if (paymentId) {
      result = await fulfillPaymentRecord(paymentId, session);
    } else {
      const { data: bySession } = await supabase
        .from("payments")
        .select("id, status, user_id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (bySession?.status === "completed") {
        result = { ok: true, reason: "session_already_completed", userId: bySession.user_id };
      } else if (bySession?.id) {
        result = await fulfillPaymentRecord(bySession.id, session);
      } else {
        result = await fulfillSessionMetadata(session);
      }
    }

    console.log({
      session_id: session.id.slice(0, 12) + "...",
      result: result.reason,
      ok: result.ok,
    });

    if (result.ok && result.userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("point_balance")
        .eq("id", result.userId)
        .maybeSingle();
      console.log({
        user_id: result.userId.slice(0, 8) + "...",
        point_balance: profile?.point_balance ?? null,
      });
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
