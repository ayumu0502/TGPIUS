/**
 * Apply stripe-fulfill-hotfix.sql to Supabase via direct Postgres connection.
 * Requires SUPABASE_DB_URL in .env.local (Project Settings → Database → Connection string URI).
 * Does not print credentials.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

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

const dbUrl =
  process.env.SUPABASE_DB_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim();

if (!dbUrl) {
  console.error(
    "Set SUPABASE_DB_URL (or DATABASE_URL) in .env.local to apply the SQL hotfix."
  );
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), "supabase/stripe-fulfill-hotfix.sql");
const sql = readFileSync(sqlPath, "utf8");

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Applied stripe-fulfill-hotfix.sql successfully");
} catch (error) {
  console.error(
    "Hotfix apply failed:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
} finally {
  await client.end();
}
