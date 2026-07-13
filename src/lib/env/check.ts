type EnvCheckResult = {
  ok: boolean;
  missing: string[];
  warnings: string[];
};

const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const REQUIRED_SERVER = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

import { validateStripeEnv } from "@/lib/stripe/env";

const RECOMMENDED_PRODUCTION = [
  "STRIPE_SECRET_KEY",
  "GOOGLE_SITE_VERIFICATION",
] as const;

export function checkEnv(): EnvCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_PUBLIC) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  if (process.env.NODE_ENV === "production") {
    for (const key of RECOMMENDED_PRODUCTION) {
      if (!process.env[key]?.trim()) warnings.push(`${key} is not set`);
    }

    const stripeValidation = validateStripeEnv();
    warnings.push(...stripeValidation.warnings);
    if (!stripeValidation.valid) {
      warnings.push(...stripeValidation.errors);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
    if (appUrl.startsWith("http://localhost")) {
      warnings.push("NEXT_PUBLIC_APP_URL still points to localhost in production");
    }
  }

  return { ok: missing.length === 0, missing, warnings };
}

export function logEnvCheck(): void {
  const result = checkEnv();
  if (!result.ok) {
    console.error("[TGPLUS] Missing required environment variables:", result.missing.join(", "));
  }
  if (result.warnings.length > 0) {
    console.warn("[TGPLUS] Environment warnings:", result.warnings.join("; "));
  }
}
