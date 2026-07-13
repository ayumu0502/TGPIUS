/**
 * Verify events-schema.sql objects exist in Supabase.
 * Usage: node scripts/verify-events-schema.mjs
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

for (const table of ["events", "event_participants", "event_checkins"]) {
  const { error } = await supabase.from(table).select("*").limit(1);
  if (error) {
    console.error(`FAIL ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`OK   ${table}`);
}

const rpcChecks = [
  ["create_event", null],
  ["join_event", { p_event_id: "00000000-0000-0000-0000-000000000000" }],
  ["list_events", { p_scope: "upcoming", p_limit: 1 }],
  ["get_event_participants", { p_event_id: "00000000-0000-0000-0000-000000000000" }],
];

for (const [fn, args] of rpcChecks) {
  const { error } = await supabase.rpc(fn, args ?? {});
  if (error && !error.message.includes("NOT_AUTHENTICATED") && !error.message.includes("EVENT_NOT_FOUND")) {
    console.error(`FAIL rpc ${fn}:`, error.message);
    process.exit(1);
  }
  console.log(`OK   rpc ${fn}`);
}

console.log("\nEvents schema verification passed.");
