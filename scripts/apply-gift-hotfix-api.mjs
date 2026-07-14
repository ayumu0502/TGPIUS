/**
 * Apply gift-send-hotfix.sql via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() || "mctpdumewffwhleggpjt";

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN, or run supabase/gift-send-hotfix.sql in SQL Editor"
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(process.cwd(), "supabase/gift-send-hotfix.sql"),
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
  console.error("Gift hotfix apply failed:", response.status, body.slice(0, 400));
  process.exit(1);
}

console.log("Applied gift-send-hotfix.sql via Management API");
