/**
 * Verify stripe-checkout-user-rpc.sql functions exist.
 * Usage: node scripts/verify-stripe-checkout-rpc.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.error("Missing Supabase URL or anon key");
  process.exit(1);
}

const supabase = createClient(url, key);

const rpcChecks = [
  "init_stripe_payment",
  "link_stripe_customer",
  "update_stripe_payment_session",
  "mark_stripe_payment_failed",
  "fulfill_stripe_payment_for_user",
];

let failed = 0;

for (const fn of rpcChecks) {
  const args =
    fn === "init_stripe_payment"
      ? {
          p_point_amount: 1000,
          p_amount_total: 1000,
          p_platform_fee: 100,
          p_net_amount: 900,
          p_metadata: {},
        }
      : fn === "link_stripe_customer"
        ? { p_stripe_customer_id: "cus_test" }
        : fn === "update_stripe_payment_session"
          ? {
              p_payment_id: "00000000-0000-0000-0000-000000000000",
              p_checkout_session_id: "cs_test",
            }
          : fn === "mark_stripe_payment_failed"
            ? {
                p_payment_id: "00000000-0000-0000-0000-000000000000",
                p_failure_message: "test",
              }
            : { p_payment_id: "00000000-0000-0000-0000-000000000000" };

  const { error } = await supabase.rpc(fn, args);
  const exists =
    error &&
    !error.message.includes("Could not find the function") &&
    !error.message.includes("could not find");
  if (exists) {
    console.log(`OK   rpc ${fn}`);
  } else {
    console.error(`FAIL rpc ${fn}:`, error?.message ?? "missing");
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} RPC(s) missing. Run supabase/stripe-checkout-user-rpc.sql`);
  process.exit(1);
}

console.log("\nStripe checkout user RPC verification passed.");
