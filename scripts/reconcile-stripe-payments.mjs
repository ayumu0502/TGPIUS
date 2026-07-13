/**
 * Reconcile paid Stripe Checkout sessions with Supabase point balances.
 * Uses user-scoped RPC when service RPC is broken. Does not print secrets or PII.
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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!stripeKey || !supabaseUrl || !anonKey || !serviceKey) {
  console.error("Missing Stripe or Supabase environment variables");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const service = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUserClient(userId) {
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.email) {
    throw new Error("USER_EMAIL_NOT_FOUND");
  }

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: profile.email,
  });

  if (linkError) {
    throw new Error(`ADMIN_LINK_FAILED: ${linkError.message}`);
  }

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) {
    throw new Error("ADMIN_LINK_TOKEN_MISSING");
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: verifyError } = await authClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (verifyError || !authData.session?.access_token) {
    throw new Error(`USER_SESSION_FAILED: ${verifyError?.message ?? "no session"}`);
  }

  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
    },
  });
}

async function fulfillPaymentRecord(paymentId, session) {
  const { data: payment, error: paymentError } = await service
    .from("payments")
    .select("status, user_id, point_amount")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    return { ok: false, reason: "payment_not_found" };
  }

  if (payment.status === "completed") {
    return { ok: true, reason: "already_completed", userId: payment.user_id };
  }

  await service
    .from("payments")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
    })
    .eq("id", paymentId);

  const { error: serviceRpcError } = await service.rpc("fulfill_stripe_payment", {
    p_payment_id: paymentId,
  });

  if (!serviceRpcError) {
    return { ok: true, reason: "service_rpc_fulfilled", userId: payment.user_id };
  }

  if (!serviceRpcError.message.includes("p_payment")) {
    return { ok: false, reason: serviceRpcError.message };
  }

  const userClient = await createUserClient(payment.user_id);
  const { error: userRpcError } = await userClient.rpc("fulfill_stripe_payment_for_user", {
    p_payment_id: paymentId,
  });

  if (userRpcError) {
    return { ok: false, reason: userRpcError.message };
  }

  return { ok: true, reason: "user_rpc_fulfilled", userId: payment.user_id };
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
      const userId = session.metadata?.user_id;
      const pointAmount = Number(session.metadata?.point_amount ?? 0);
      if (!userId || !pointAmount) {
        result = { ok: false, reason: "missing_metadata" };
      } else {
        const { data: bySession } = await service
          .from("payments")
          .select("id")
          .eq("stripe_checkout_session_id", session.id)
          .maybeSingle();
        if (bySession?.id) {
          result = await fulfillPaymentRecord(bySession.id, session);
        } else {
          result = { ok: false, reason: "no_payment_record" };
        }
      }
    }

    console.log({
      session_id: session.id.slice(0, 14) + "...",
      result: result.reason,
      ok: result.ok,
    });

    if (result.ok && result.userId) {
      const { data: profile } = await service
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
