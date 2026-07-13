import type Stripe from "stripe";
import { stripeSafeLog } from "@/lib/stripe/env";

export type CheckoutFailurePhase =
  | "env_validation"
  | "pending_payment"
  | "stripe_customer"
  | "checkout_session"
  | "attach_session";

export function formatStripeError(error: unknown): Record<string, unknown> {
  if (error && typeof error === "object" && "type" in error) {
    const stripeError = error as Stripe.StripeRawError;
    return {
      kind: "stripe_api",
      type: stripeError.type ?? "unknown",
      code: stripeError.code ?? null,
      param: stripeError.param ?? null,
      statusCode: stripeError.statusCode ?? null,
      message: stripeError.message ?? "Stripe API error",
    };
  }

  if (error instanceof Error) {
    return {
      kind: "error",
      name: error.name,
      message: error.message,
    };
  }

  return { kind: "unknown", message: String(error) };
}

export function logStripeCheckoutFailure(
  phase: CheckoutFailurePhase,
  error: unknown,
  context?: Record<string, unknown>
): void {
  stripeSafeLog("checkout session creation failed", {
    phase,
    ...formatStripeError(error),
    ...context,
  });
}
