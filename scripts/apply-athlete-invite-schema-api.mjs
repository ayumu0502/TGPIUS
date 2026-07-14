/**
 * Apply athlete-invite-schema.sql via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() || "mctpdumewffwhleggpjt";

if (!token) {
  console.error(
    "Set SUPABASE_ACCESS_TOKEN, or run supabase/athlete-invite-schema.sql in SQL Editor"
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(process.cwd(), "supabase/athlete-invite-schema.sql"),
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
  console.error("athlete-invite-schema apply failed:", response.status, body.slice(0, 600));
  process.exit(1);
}

console.log("Applied athlete-invite-schema.sql via Management API");
