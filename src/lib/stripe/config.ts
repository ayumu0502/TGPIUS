import { isStripeConfigured } from "@/lib/stripe/client";

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

export function getStripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (!key) return null;
  if (!key.startsWith("pk_test_") && !key.startsWith("pk_live_")) return null;
  return key;
}

export function getStripeCheckoutStatus(): StripeCheckoutStatus {
  const mode = getStripeModeFromEnv();
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!secretKey) {
    return {
      ready: false,
      mode: "unset",
      message:
        "Stripe が未設定です。.env.local に STRIPE_SECRET_KEY（テスト用 Secret key: sk_test_...）を設定し、サーバーを再起動してください。",
    };
  }

  if (mode === "unset") {
    return {
      ready: false,
      mode: "unset",
      message:
        "STRIPE_SECRET_KEY の形式が正しくありません。Stripe Dashboard のテスト用 Secret key（sk_test_...）を設定してください。",
    };
  }

  if (secretKey.includes("...") || secretKey.length < 24) {
    return {
      ready: false,
      mode,
      message:
        "STRIPE_SECRET_KEY がプレースホルダーのままです。Stripe Dashboard からコピーした実際の Secret key を設定してください。",
    };
  }

  if (!appUrl) {
    return {
      ready: false,
      mode,
      message:
        "NEXT_PUBLIC_APP_URL が未設定です（例: http://localhost:3000）。Stripe のリダイレクト先に使用します。",
    };
  }

  return { ready: true, mode, message: null };
}

export function isStripeCheckoutReady(): boolean {
  return getStripeCheckoutStatus().ready && isStripeConfigured();
}
