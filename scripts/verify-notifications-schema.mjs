/**
 * Verify notifications-schema.sql objects exist in Supabase.
 * Usage: node scripts/verify-notifications-schema.mjs
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

const { error: tableError } = await supabase
  .from("notifications")
  .select("id, type, title, is_read, recipient_id")
  .limit(1);

if (tableError) {
  console.error("FAIL notifications:", tableError.message);
  process.exit(1);
}

console.log("OK   notifications");

const rpcChecks = [
  "mark_notification_read",
  "mark_all_notifications_read",
  "create_notification",
];

for (const fn of rpcChecks) {
  const args =
    fn === "mark_all_notifications_read"
      ? {}
      : fn === "create_notification"
        ? {
            p_recipient_id: "00000000-0000-0000-0000-000000000000",
            p_actor_id: null,
            p_type: "announcement",
            p_title: "test",
          }
        : { p_notification_id: "00000000-0000-0000-0000-000000000000" };

  const { error } = await supabase.rpc(fn, args);
  const ok = Boolean(error);
  if (ok) {
    console.log(`OK   rpc ${fn}`);
  } else {
    console.error(`FAIL rpc ${fn}: unexpected success`);
    process.exit(1);
  }
}

console.log("\nNotifications schema verification passed.");
