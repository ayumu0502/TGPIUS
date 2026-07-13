import Stripe from "stripe";
import { assertProductionStripeMode } from "@/lib/stripe/mode";
import { getStripeSecretKey, validateStripeEnv } from "@/lib/stripe/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = getStripeSecretKey();
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const validation = validateStripeEnv();
    if (!validation.valid) {
      throw new Error(validation.errors[0] ?? "Stripe environment is invalid");
    }

    assertProductionStripeMode();
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function isStripeConfigured(): boolean {
  const key = getStripeSecretKey();
  if (!key) return false;
  return key.startsWith("sk_test_") || key.startsWith("sk_live_");
}
