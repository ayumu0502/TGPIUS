/**
 * Test Stripe API connectivity without printing secrets.
 * Usage: node scripts/test-stripe-connection.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

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

const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
  console.error("FAIL: STRIPE_SECRET_KEY is missing or invalid format");
  process.exit(1);
}

if (secretKey.includes("...") || secretKey.length < 24) {
  console.error("FAIL: STRIPE_SECRET_KEY looks like a placeholder, not a real key");
  process.exit(1);
}

try {
  const stripe = new Stripe(secretKey);
  await stripe.balance.retrieve();
  console.log("OK: Stripe API connection succeeded (test mode)");
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown error";
  console.error("FAIL: Stripe API error:", message);
  process.exit(1);
}
