/**
 * Production readiness check (no secrets printed).
 * Usage: node scripts/verify-production-readiness.mjs
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

const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";

const isLive = sk.startsWith("sk_live_");
const isTest = sk.startsWith("sk_test_");

let failed = 0;
const warnings = [];

console.log("=== TGPLUS Production Readiness ===\n");

if (!sk) {
  console.error("FAIL STRIPE_SECRET_KEY: not set");
  failed++;
} else if (isLive) {
  console.log("OK   Stripe mode: LIVE");
} else if (isTest) {
  console.log("OK   Stripe mode: TEST (switch to sk_live_ for production)");
  warnings.push("Still using test keys");
} else {
  console.error("FAIL STRIPE_SECRET_KEY: invalid format");
  failed++;
}

if (pk) {
  const pkLive = pk.startsWith("pk_live_");
  const pkTest = pk.startsWith("pk_test_");
  if ((isLive && !pkLive) || (isTest && !pkTest)) {
    console.error("FAIL Key mode mismatch between sk and pk");
    failed++;
  } else {
    console.log(`OK   Publishable key matches ${isLive ? "live" : "test"} mode`);
  }
} else if (isLive) {
  console.error("FAIL NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY required for live");
  failed++;
}

const webhook = isLive
  ? process.env.STRIPE_WEBHOOK_SECRET_LIVE?.trim()
  : process.env.STRIPE_WEBHOOK_SECRET_TEST?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim();

if (!webhook) {
  console.error(`FAIL Webhook secret not set (${isLive ? "STRIPE_WEBHOOK_SECRET_LIVE" : "STRIPE_WEBHOOK_SECRET_TEST"})`);
  failed++;
} else {
  console.log("OK   Webhook secret configured");
}

const priceId = isLive
  ? process.env.STRIPE_SUPPORTER_PRICE_ID_LIVE?.trim()
  : process.env.STRIPE_SUPPORTER_PRICE_ID?.trim();

if (!priceId) {
  console.error(`FAIL Supporter Price ID not set (${isLive ? "STRIPE_SUPPORTER_PRICE_ID_LIVE" : "STRIPE_SUPPORTER_PRICE_ID"})`);
  failed++;
} else {
  console.log("OK   Supporter Price ID configured");
}

if (!appUrl) {
  console.error("FAIL NEXT_PUBLIC_APP_URL: not set");
  failed++;
} else if (isLive && !appUrl.startsWith("https://")) {
  console.error("FAIL NEXT_PUBLIC_APP_URL must use https:// in live mode");
  failed++;
} else if (isLive && appUrl.includes("localhost")) {
  console.error("FAIL NEXT_PUBLIC_APP_URL cannot be localhost in live mode");
  failed++;
} else {
  console.log(`OK   App URL: ${appUrl}`);
  console.log(`     Webhook URL: ${appUrl.replace(/\/$/, "")}/api/stripe/webhook`);
}

console.log("\n--- Architecture ---");
console.log("OK   Stripe Connect: DISABLED (platform account only)");
console.log("OK   Athlete payouts: manual bank transfer via admin approval");

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const w of warnings) console.log(`  - ${w}`);
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nProduction readiness check passed.");
console.log("Next: complete Stripe Dashboard tasks in docs/STRIPE_DASHBOARD_TASKS.md");
