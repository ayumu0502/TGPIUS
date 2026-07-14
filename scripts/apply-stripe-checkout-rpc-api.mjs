/**
 * Apply stripe-checkout-user-rpc.sql via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() || "mctpdumewffwhleggpjt";

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN, or run supabase/stripe-checkout-user-rpc.sql in SQL Editor"
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(process.cwd(), "supabase/stripe-checkout-user-rpc.sql"),
  "utf8"
);

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

const body = await response.text();
if (!response.ok) {
  console.error("stripe-checkout-user-rpc apply failed:", response.status, body.slice(0, 600));
  process.exit(1);
}

console.log("Applied stripe-checkout-user-rpc.sql via Management API");
