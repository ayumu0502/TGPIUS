/**
 * Verify fanclub-schema.sql objects exist in Supabase.
 * Usage: node --env-file=.env.local scripts/verify-fanclub-schema.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key");
  process.exit(1);
}

const supabase = createClient(url, key);

for (const table of [
  "fanclub_plans",
  "fanclub_benefits",
  "fanclub_memberships",
  "fanclub_posts",
]) {
  const { error } = await supabase.from(table).select("*").limit(1);
  if (error) {
    console.error(`FAIL ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`OK   ${table}`);
}

const rpcChecks = [
  ["list_fanclub_catalog", { p_limit: 1 }],
  ["get_admin_fanclub_analytics", {}],
];

for (const [fn, args] of rpcChecks) {
  const { error } = await supabase.rpc(fn, args);
  if (error) {
    console.error(`FAIL rpc ${fn}:`, error.message);
    process.exit(1);
  }
  console.log(`OK   rpc ${fn}`);
}

console.log("\nFanclub schema verification passed.");
