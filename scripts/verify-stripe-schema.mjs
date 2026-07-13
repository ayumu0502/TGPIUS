/**
 * Verify stripe-schema.sql objects exist in Supabase.
 * Usage: node scripts/verify-stripe-schema.mjs
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
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key");
  process.exit(1);
}

const supabase = createClient(url, key);

const checks = [
  { table: "payments", columns: "id, status, point_amount, platform_fee" },
  { table: "stripe_customers", columns: "user_id, stripe_customer_id" },
  {
    table: "point_transactions",
    columns: "id, payment_id",
  },
];

let failed = 0;

for (const check of checks) {
  const { error } = await supabase.from(check.table).select(check.columns).limit(1);
  if (error) {
    console.error(`FAIL ${check.table}:`, error.message);
    failed += 1;
  } else {
    console.log(`OK   ${check.table}`);
  }
}

const rpcChecks = ["fulfill_stripe_payment", "refund_stripe_payment"];
for (const fn of rpcChecks) {
  const { error } = await supabase.rpc(fn, { p_payment_id: "00000000-0000-0000-0000-000000000000" });
  const ok =
    error &&
    (error.message.includes("PAYMENT_NOT_FOUND") ||
      error.message.includes("invalid input syntax"));
  if (ok) {
    console.log(`OK   rpc ${fn}`);
  } else {
    console.error(`FAIL rpc ${fn}:`, error?.message ?? "unexpected success");
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed. Run supabase/stripe-schema.sql`);
  process.exit(1);
}

console.log("\nStripe schema verification passed.");
