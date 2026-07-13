/**
 * Apply stripe-fulfill-hotfix.sql via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens).
 * Does not print secrets.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() || "mctpdumewffwhleggpjt";

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN, then run: npx supabase db query -f supabase/stripe-fulfill-hotfix.sql --linked"
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(process.cwd(), "supabase/stripe-fulfill-hotfix.sql"),
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
  console.error("Hotfix apply failed:", response.status, body.slice(0, 300));
  process.exit(1);
}

console.log("Applied stripe-fulfill-hotfix.sql via Management API");
