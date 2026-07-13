/**
 * Verify rankings-schema.sql objects exist in Supabase.
 * Usage: node scripts/verify-rankings-schema.mjs
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

const { error } = await supabase.rpc("get_athlete_rankings", {
  p_category: "overall",
  p_period: "month",
  p_limit: 1,
});

if (error) {
  console.error("FAIL rpc get_athlete_rankings:", error.message);
  process.exit(1);
}

console.log("OK   rpc get_athlete_rankings");
console.log("\nRankings schema verification passed.");
