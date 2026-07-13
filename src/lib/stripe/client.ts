import Stripe from "stripe";
import { assertProductionStripeMode } from "@/lib/stripe/mode";
import {
  getStripeSecretKey,
  stripeSafeLog,
  validateStripeEnvForCheckout,
} from "@/lib/stripe/env";
import { formatStripeError } from "@/lib/stripe/checkout-errors";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = getStripeSecretKey();
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const validation = validateStripeEnvForCheckout();
    if (!validation.valid) {
      stripeSafeLog("stripe env validation failed", {
        mode: validation.mode,
        errors: validation.errors,
      });
      throw new Error(validation.errors[0] ?? "Stripe environment is invalid");
    }

    assertProductionStripeMode();
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function resetStripeClientForTests(): void {
  stripeClient = null;
}

export function getStripeClientInitError(): string | null {
  try {
    getStripe();
    return null;
  } catch (error) {
    return formatStripeError(error).message as string;
  }
}

export function isStripeConfigured(): boolean {
  const key = getStripeSecretKey();
  if (!key) return false;
  return key.startsWith("sk_test_") || key.startsWith("sk_live_");
}
