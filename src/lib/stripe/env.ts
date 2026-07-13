import { getStripeMode, type StripeMode } from "@/lib/stripe/mode";

export type StripeEnvValidation = {
  valid: boolean;
  mode: StripeMode;
  errors: string[];
  warnings: string[];
};

const SENSITIVE_KEYS = new Set([
  "secret",
  "key",
  "token",
  "password",
  "authorization",
  "stripe-signature",
  "email",
  "customer",
]);

function keyMode(key: string | undefined): StripeMode {
  if (!key?.trim()) return "unset";
  if (key.startsWith("sk_live_") || key.startsWith("pk_live_")) return "live";
  if (key.startsWith("sk_test_") || key.startsWith("pk_test_")) return "test";
  return "unset";
}

export function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key || null;
}

export function getStripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return key || null;
}

export function getStripeWebhookSecret(): string | null {
  const mode = getStripeMode();
  if (mode === "live") {
    return (
      process.env.STRIPE_WEBHOOK_SECRET_LIVE?.trim() ||
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      null
    );
  }
  if (mode === "test") {
    return (
      process.env.STRIPE_WEBHOOK_SECRET_TEST?.trim() ||
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      null
    );
  }
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function getSupporterPriceId(): string | null {
  const mode = getStripeMode();
  if (mode === "live") {
    return (
      process.env.STRIPE_SUPPORTER_PRICE_ID_LIVE?.trim() ||
      process.env.STRIPE_SUPPORTER_PRICE_ID?.trim() ||
      null
    );
  }
  return process.env.STRIPE_SUPPORTER_PRICE_ID?.trim() || null;
}

export function validateStripeEnv(): StripeEnvValidation {
  const secret = getStripeSecretKey();
  const publishable = getStripePublishableKey();
  const mode = getStripeMode();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!secret) {
    errors.push("STRIPE_SECRET_KEY が未設定です");
  } else if (mode === "unset") {
    errors.push("STRIPE_SECRET_KEY の形式が正しくありません（sk_test_ または sk_live_）");
  }

  if (publishable) {
    const pubMode = keyMode(publishable);
    if (pubMode === "unset") {
      errors.push(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY の形式が正しくありません（pk_test_ または pk_live_）"
      );
    } else if (mode !== "unset" && pubMode !== mode) {
      errors.push(
        `Stripe キーのモードが一致しません（Secret: ${mode}, Publishable: ${pubMode}）`
      );
    }
  }

  if (!getStripeWebhookSecret()) {
    const mode = getStripeMode();
    if (mode === "live") {
      errors.push("STRIPE_WEBHOOK_SECRET_LIVE が未設定です（本番 Webhook 用）");
    } else {
      warnings.push("Webhook Secret が未設定です（STRIPE_WEBHOOK_SECRET_TEST）");
    }
  }

  if (!getSupporterPriceId()) {
    const mode = getStripeMode();
    if (mode === "live") {
      errors.push("STRIPE_SUPPORTER_PRICE_ID_LIVE が未設定です");
    } else {
      warnings.push("STRIPE_SUPPORTER_PRICE_ID が未設定です");
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!appUrl) {
    errors.push("NEXT_PUBLIC_APP_URL が未設定です");
  } else if (process.env.NODE_ENV === "production") {
    if (appUrl.includes("localhost")) {
      errors.push("本番環境で NEXT_PUBLIC_APP_URL が localhost を指しています");
    }
    if (mode === "live" && !appUrl.startsWith("https://")) {
      warnings.push("本番 Live モードでは HTTPS の APP_URL を推奨します");
    }
  }

  if (
    process.env.NODE_ENV === "production" &&
    mode === "test" &&
    process.env.STRIPE_ALLOW_TEST_IN_PRODUCTION !== "true"
  ) {
    errors.push("本番環境で Stripe テストキーが使用されています（Live キーに切り替えてください）");
  }

  if (process.env.NODE_ENV === "production" && mode === "live") {
    if (!publishable) {
      errors.push("本番では NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY（pk_live_）が必須です");
    }
  }

  return { valid: errors.length === 0, mode, errors, warnings };
}

export function stripeSafeLog(
  message: string,
  data?: Record<string, unknown>
): void {
  if (!data) {
    console.info(`[TGPLUS:stripe] ${message}`);
    return;
  }

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower) || lower.includes("secret") || lower.includes("key")) {
      safe[key] = "[redacted]";
    } else if (typeof value === "string" && value.length > 64) {
      safe[key] = `${value.slice(0, 8)}...`;
    } else {
      safe[key] = value;
    }
  }
  console.info(`[TGPLUS:stripe] ${message}`, safe);
}
