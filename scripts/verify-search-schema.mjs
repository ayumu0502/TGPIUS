/**
 * Verify search-schema.sql objects exist in Supabase.
 * Usage: node scripts/verify-search-schema.mjs
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

const { error: followsError } = await supabase
  .from("follows")
  .select("follower_id, following_id")
  .limit(1);

if (followsError) {
  console.error("FAIL follows:", followsError.message);
  process.exit(1);
}
console.log("OK   follows");

const rpcChecks = [
  "search_athletes",
  "search_users",
  "get_discovery_athletes",
  "get_search_filter_options",
];

for (const fn of rpcChecks) {
  const args =
    fn === "search_athletes"
      ? { p_query: "", p_limit: 1, p_offset: 0 }
      : fn === "search_users"
        ? { p_query: "test", p_limit: 1 }
        : fn === "get_discovery_athletes"
          ? { p_section: "popular", p_limit: 1 }
          : {};

  const { error } = await supabase.rpc(fn, args);
  if (error) {
    console.error(`FAIL rpc ${fn}:`, error.message);
    process.exit(1);
  }
  console.log(`OK   rpc ${fn}`);
}

console.log("\nSearch schema verification passed.");
