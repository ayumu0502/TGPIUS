export type StripeMode = "live" | "test" | "unset";

export function getStripeMode(): StripeMode {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return "unset";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unset";
}

export function isStripeLiveMode(): boolean {
  return getStripeMode() === "live";
}

export function assertProductionStripeMode(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.STRIPE_ALLOW_TEST_IN_PRODUCTION === "true") return;
  const mode = getStripeMode();
  if (mode === "test") {
    console.warn(
      "[TGPLUS] Production is using Stripe TEST keys. Set live keys (sk_live_...) before public launch."
    );
  }
}
