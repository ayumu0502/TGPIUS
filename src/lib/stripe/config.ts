import { isStripeConfigured, getStripeClientInitError } from "@/lib/stripe/client";
import {
  getStripePublishableKey,
  validateStripeEnvForCheckout,
} from "@/lib/stripe/env";

export type StripeCheckoutStatus = {
  ready: boolean;
  message: string | null;
  mode: "test" | "live" | "unset";
};

export function getStripeModeFromEnv(): StripeCheckoutStatus["mode"] {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return "unset";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unset";
}

export function getStripeCheckoutStatus(): StripeCheckoutStatus {
  const mode = getStripeModeFromEnv();
  const validation = validateStripeEnvForCheckout();

  if (!validation.valid) {
    return {
      ready: false,
      mode: validation.mode === "unset" ? mode : validation.mode,
      message: validation.errors[0] ?? "Stripe の設定が正しくありません",
    };
  }

  const publishable = getStripePublishableKey();
  if (!publishable) {
    return {
      ready: false,
      mode,
      message:
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY が未設定です（pk_test_... を Vercel に設定してください）",
    };
  }

  const initError = getStripeClientInitError();
  if (initError) {
    return {
      ready: false,
      mode,
      message: initError,
    };
  }

  return { ready: true, mode, message: null };
}

export function isStripeCheckoutReady(): boolean {
  return getStripeCheckoutStatus().ready && isStripeConfigured();
}
