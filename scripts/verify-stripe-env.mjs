/**
 * Verify Stripe-related environment variables (no secret values printed).
 * Usage: node scripts/verify-stripe-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

const checks = [
  {
    key: "STRIPE_SECRET_KEY",
    validate: (v) => v.startsWith("sk_test_") || v.startsWith("sk_live_"),
    hint: "sk_test_... or sk_live_...",
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    validate: (v) => v.startsWith("pk_test_") || v.startsWith("pk_live_"),
    hint: "pk_test_... or pk_live_...",
    optional: true,
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    validate: (v) => v.startsWith("whsec_"),
    hint: "whsec_... (or STRIPE_WEBHOOK_SECRET_TEST / _LIVE)",
    resolve: () =>
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      process.env.STRIPE_WEBHOOK_SECRET_TEST?.trim() ||
      process.env.STRIPE_WEBHOOK_SECRET_LIVE?.trim() ||
      "",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    validate: (v) => v.length > 20,
    hint: "Supabase service_role key",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    validate: (v) => v.startsWith("http"),
    hint: "http://localhost:3000 or production URL",
  },
  {
    key: "STRIPE_SUPPORTER_PRICE_ID",
    validate: (v) => v.startsWith("price_"),
    hint: "price_... from Stripe Dashboard",
    optional: true,
    resolve: () =>
      process.env.STRIPE_SUPPORTER_PRICE_ID?.trim() ||
      process.env.STRIPE_SUPPORTER_PRICE_ID_LIVE?.trim() ||
      "",
  },
];

let failed = 0;

for (const check of checks) {
  const value = (check.resolve ? check.resolve() : process.env[check.key]?.trim()) ?? "";
  if (!value) {
    if (check.optional) {
      console.log(`SKIP ${check.key} (optional, not set)`);
      continue;
    }
    console.error(`FAIL ${check.key}: not set`);
    failed += 1;
    continue;
  }
  if (!check.validate(value)) {
    console.error(`FAIL ${check.key}: invalid format (expected ${check.hint})`);
    failed += 1;
    continue;
  }
  const mode =
    check.key === "STRIPE_SECRET_KEY" && value.startsWith("sk_test_")
      ? " [test mode]"
      : check.key === "STRIPE_SECRET_KEY" && value.startsWith("sk_live_")
        ? " [live mode]"
        : "";
  console.log(`OK   ${check.key}${mode}`);
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed. Update .env.local and restart the server.`);
  process.exit(1);
}

console.log("\nStripe environment verification passed.");
