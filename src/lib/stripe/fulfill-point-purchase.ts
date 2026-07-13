import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { logWebhook, logWebhookError } from "@/lib/stripe/webhook-log";

export type FulfillSource = "webhook" | "return";

type FulfillOptions = {
  userClient?: SupabaseClient;
};

function getPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  if (!session.payment_intent) return null;
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent.id;
}

function getCustomerId(session: Stripe.Checkout.Session): string | null {
  if (!session.customer) return null;
  return typeof session.customer === "string"
    ? session.customer
    : session.customer.id;
}

function isBrokenFulfillRpcError(message: string): boolean {
  return (
    message.includes("p_payment") ||
    message.includes("FULFILL_RPC_FAILED") ||
    message.includes("fulfill_stripe_payment")
  );
}

async function syncPaymentFromSession(
  paymentId: string,
  session: Stripe.Checkout.Session,
  userClient?: SupabaseClient
): Promise<void> {
  const supabase = userClient ?? createServiceClient();
  const payload = {
    stripe_payment_intent_id: getPaymentIntentId(session),
    stripe_customer_id: getCustomerId(session),
    stripe_checkout_session_id: session.id,
  };

  if (userClient) {
    const { error } = await userClient.rpc("update_stripe_payment_session", {
      p_payment_id: paymentId,
      p_checkout_session_id: session.id,
    });
    if (error && !error.message.includes("could not find the function")) {
      throw new Error(`SESSION_ATTACH_FAILED: ${error.message}`);
    }
    return;
  }

  await supabase.from("payments").update(payload).eq("id", paymentId);
}

async function createUserScopedClient(userId: string): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_ANON_NOT_CONFIGURED");
  }

  const service = createServiceClient();
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.email) {
    throw new Error("USER_EMAIL_NOT_FOUND");
  }

  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
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

  const authClient = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: verifyError } = await authClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (verifyError || !authData.session?.access_token) {
    throw new Error(`USER_SESSION_FAILED: ${verifyError?.message ?? "no session"}`);
  }

  return createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
    },
  });
}

async function fulfillStripePaymentRecordForUser(
  paymentId: string,
  userClient: SupabaseClient,
  session?: Stripe.Checkout.Session
): Promise<boolean> {
  const { data: existing, error: lookupError } = await userClient
    .from("payments")
    .select("status")
    .eq("id", paymentId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`PAYMENT_LOOKUP_FAILED: ${lookupError.message}`);
  }

  if (existing?.status === "completed") {
    return true;
  }

  if (session) {
    await syncPaymentFromSession(paymentId, session, userClient);
  }

  const { error } = await userClient.rpc("fulfill_stripe_payment_for_user", {
    p_payment_id: paymentId,
  });

  if (error) {
    throw new Error(`USER_FULFILL_RPC_FAILED: ${error.message}`);
  }

  return true;
}

export async function fulfillStripePaymentRecord(
  paymentId: string,
  session?: Stripe.Checkout.Session,
  options?: FulfillOptions
): Promise<boolean> {
  if (options?.userClient) {
    return fulfillStripePaymentRecordForUser(
      paymentId,
      options.userClient,
      session
    );
  }

  const supabase = createServiceClient();

  const { data: existing, error: lookupError } = await supabase
    .from("payments")
    .select("status")
    .eq("id", paymentId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`PAYMENT_LOOKUP_FAILED: ${lookupError.message}`);
  }

  if (existing?.status === "completed") {
    return true;
  }

  if (session) {
    await syncPaymentFromSession(paymentId, session);
  }

  const { error } = await supabase.rpc("fulfill_stripe_payment", {
    p_payment_id: paymentId,
  });

  if (error) {
    if (isBrokenFulfillRpcError(error.message)) {
      const { data: payment } = await supabase
        .from("payments")
        .select("user_id")
        .eq("id", paymentId)
        .maybeSingle();

      if (payment?.user_id) {
        logWebhook("service RPC broken, retrying with user RPC fallback", {
          payment_id: paymentId,
        });
        const userClient = await createUserScopedClient(payment.user_id);
        return fulfillStripePaymentRecordForUser(
          paymentId,
          userClient,
          session
        );
      }
    }

    if (isBrokenFulfillRpcError(error.message)) {
      throw new Error(
        "FULFILL_RPC_BROKEN: Run supabase/stripe-fulfill-hotfix.sql in Supabase SQL Editor"
      );
    }
    throw new Error(`FULFILL_RPC_FAILED: ${error.message}`);
  }

  return true;
}

async function fulfillViaSessionMetadata(
  session: Stripe.Checkout.Session,
  userId: string,
  pointAmount: number,
  amountTotal: number,
  source: FulfillSource,
  options?: FulfillOptions
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data: paymentId, error } = await supabase.rpc(
    "fulfill_stripe_session_metadata",
    {
      p_checkout_session_id: session.id,
      p_user_id: userId,
      p_point_amount: pointAmount,
      p_amount_total: amountTotal,
      p_payment_intent_id: getPaymentIntentId(session),
      p_stripe_customer_id: getCustomerId(session),
    }
  );

  if (error) {
    if (error.message.includes("fulfill_stripe_session_metadata")) {
      logWebhook("metadata RPC unavailable, using payment insert fallback", {
        session_id: session.id,
        source,
      });
      return fulfillViaSessionMetadataFallback(
        session,
        userId,
        pointAmount,
        amountTotal,
        source,
        options
      );
    }
    throw new Error(`METADATA_FULFILL_FAILED: ${error.message}`);
  }

  logWebhook("fulfilled via session metadata RPC", {
    session_id: session.id,
    payment_id: paymentId,
    user_id: userId,
    point_amount: pointAmount,
    source,
  });
  return true;
}

async function fulfillViaSessionMetadataFallback(
  session: Stripe.Checkout.Session,
  userId: string,
  pointAmount: number,
  amountTotal: number,
  source: FulfillSource,
  options?: FulfillOptions
): Promise<boolean> {
  const userClient =
    options?.userClient ?? (await createUserScopedClient(userId));

  const supabase = createServiceClient();
  const platformFee = Math.floor(amountTotal * 0.1);
  const netAmount = amountTotal - platformFee;

  const { data: inserted, error: insertError } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: getPaymentIntentId(session),
      stripe_customer_id: getCustomerId(session),
      point_amount: pointAmount,
      amount_total: amountTotal,
      platform_fee: platformFee,
      net_amount: netAmount,
      status: "pending",
      payment_method: "stripe",
      metadata: { source, checkout_mode: "direct_fulfill" },
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.message.includes("duplicate")) {
      const { data: existing } = await supabase
        .from("payments")
        .select("id, status")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (existing?.status === "completed") {
        return true;
      }
      if (existing?.id) {
        return fulfillStripePaymentRecord(existing.id, session, options);
      }
    }
    throw new Error(`PAYMENT_INSERT_FAILED: ${insertError.message}`);
  }

  if (!inserted?.id) {
    throw new Error("PAYMENT_INSERT_EMPTY");
  }

  return fulfillStripePaymentRecord(inserted.id, session, {
    ...options,
    userClient,
  });
}

export async function fulfillCheckoutSessionPoints(
  session: Stripe.Checkout.Session,
  source: FulfillSource,
  options?: FulfillOptions
): Promise<boolean> {
  if (session.mode !== "payment") {
    logWebhook("skipped non-payment session", {
      session_id: session.id,
      mode: session.mode,
      source,
    });
    return false;
  }

  if (session.payment_status !== "paid") {
    logWebhook("skipped unpaid session", {
      session_id: session.id,
      payment_status: session.payment_status,
      source,
    });
    return false;
  }

  const userId = session.metadata?.user_id;
  const pointAmount = Number(session.metadata?.point_amount ?? 0);
  const amountTotal = Number(session.metadata?.amount_total ?? pointAmount);
  const paymentId = session.metadata?.payment_id;
  const checkoutMode = session.metadata?.checkout_mode ?? "payment_record";

  logWebhook("fulfillment started", {
    session_id: session.id,
    source,
    checkout_mode: checkoutMode,
    has_payment_id: Boolean(paymentId),
    has_user_id: Boolean(userId),
    point_amount: pointAmount || null,
    uses_user_rpc: Boolean(options?.userClient),
  });

  const supabase = createServiceClient();

  if (paymentId) {
    try {
      await fulfillStripePaymentRecord(paymentId, session, options);
      logWebhook("fulfilled via metadata payment_id", {
        session_id: session.id,
        payment_id: paymentId,
        source,
      });
      return true;
    } catch (error) {
      logWebhookError("metadata payment_id fulfillment failed", error, {
        session_id: session.id,
        payment_id: paymentId,
        source,
      });
      if (!options?.userClient) {
        throw error;
      }
    }
  }

  const { data: bySession, error: sessionLookupError } = await supabase
    .from("payments")
    .select("id, status")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (sessionLookupError) {
    throw new Error(`SESSION_LOOKUP_FAILED: ${sessionLookupError.message}`);
  }

  if (bySession) {
    if (bySession.status === "completed") {
      logWebhook("already fulfilled via session id lookup", {
        session_id: session.id,
        payment_id: bySession.id,
        source,
      });
      return true;
    }

    await fulfillStripePaymentRecord(bySession.id, session, options);
    logWebhook("fulfilled via session id lookup", {
      session_id: session.id,
      payment_id: bySession.id,
      source,
    });
    return true;
  }

  if (!userId || !pointAmount) {
    logWebhook("missing fulfillment metadata", {
      session_id: session.id,
      source,
      has_user_id: Boolean(userId),
      point_amount: pointAmount || null,
    });
    return false;
  }

  return fulfillViaSessionMetadata(
    session,
    userId,
    pointAmount,
    amountTotal,
    source,
    options
  );
}

export async function fulfillPaymentIntentPoints(
  paymentIntent: Stripe.PaymentIntent,
  source: FulfillSource,
  options?: FulfillOptions
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data: payment, error: lookupError } = await supabase
    .from("payments")
    .select("id, status")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`INTENT_LOOKUP_FAILED: ${lookupError.message}`);
  }

  if (payment) {
    if (payment.status === "completed") {
      return true;
    }
    await fulfillStripePaymentRecord(payment.id, undefined, options);
    logWebhook("fulfilled via payment_intent lookup", {
      payment_intent_id: paymentIntent.id,
      payment_id: payment.id,
      source,
    });
    return true;
  }

  const paymentId = paymentIntent.metadata?.payment_id;
  if (paymentId) {
    await fulfillStripePaymentRecord(paymentId, undefined, options);
    logWebhook("fulfilled via payment_intent metadata payment_id", {
      payment_intent_id: paymentIntent.id,
      payment_id: paymentId,
      source,
    });
    return true;
  }

  const userId = paymentIntent.metadata?.user_id;
  const pointAmount = Number(paymentIntent.metadata?.point_amount ?? 0);
  const amountTotal = Number(paymentIntent.metadata?.amount_total ?? pointAmount);
  const sessionId = paymentIntent.metadata?.checkout_session_id;

  if (sessionId && userId && pointAmount) {
    return fulfillViaSessionMetadata(
      {
        id: sessionId,
        mode: "payment",
        payment_status: "paid",
        metadata: paymentIntent.metadata,
        payment_intent: paymentIntent.id,
        customer: paymentIntent.customer,
      } as Stripe.Checkout.Session,
      userId,
      pointAmount,
      amountTotal,
      source,
      options
    );
  }

  logWebhook("payment_intent fulfillment skipped", {
    payment_intent_id: paymentIntent.id,
    source,
    has_user_id: Boolean(userId),
    point_amount: pointAmount || null,
  });
  return false;
}
