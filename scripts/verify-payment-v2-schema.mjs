/**
 * Verify production-payment-v2 schema (billing_records, gift idempotency, earnings ledger).
 * Usage: node scripts/verify-payment-v2-schema.mjs
 */
import { createClient } from "@supabase/supabase-js";
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const checks = [
  { table: "billing_records", columns: ["id", "user_id", "record_type", "amount_yen"] },
  { table: "gift_idempotency", columns: ["id", "sender_id", "idempotency_key", "gift_id"] },
  { table: "athlete_earnings_ledger", columns: ["id", "athlete_id", "source_type", "net_amount"] },
];

let failed = 0;

for (const check of checks) {
  const { error } = await supabase.from(check.table).select(check.columns.join(",")).limit(1);
  if (error) {
    console.error(`FAIL ${check.table}: ${error.message}`);
    failed += 1;
  } else {
    console.log(`OK   ${check.table}`);
  }
}

const { error: rpcError } = await supabase.rpc("send_gift", {
  p_receiver_id: "00000000-0000-0000-0000-000000000000",
  p_amount: 100,
  p_message: "",
  p_idempotency_key: "verify-schema-check",
});

if (rpcError && /p_idempotency_key|send_gift/i.test(rpcError.message)) {
  console.error("FAIL send_gift RPC: idempotency parameter not deployed");
  console.error("     Run supabase/production-payment-v2-schema.sql in Supabase SQL Editor");
  failed += 1;
} else {
  console.log("OK   rpc send_gift (idempotency param)");
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nPayment v2 schema verification passed.");
