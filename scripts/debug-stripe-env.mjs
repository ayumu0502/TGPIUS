/**
 * Quick Stripe env validation (no secrets printed).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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
process.env.NODE_ENV = "production";
process.env.STRIPE_ALLOW_TEST_IN_PRODUCTION = "true";
process.env.NEXT_PUBLIC_APP_URL = "https://tgpius.vercel.app";

function keyMode(key) {
  if (!key) return "unset";
  if (key.startsWith("sk_live_") || key.startsWith("pk_live_")) return "live";
  if (key.startsWith("sk_test_") || key.startsWith("pk_test_")) return "test";
  return "unset";
}

const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
const skMode = keyMode(sk);
const pkMode = keyMode(pk);

console.log("sk mode:", skMode, "prefix:", sk.slice(0, 8));
console.log("pk mode:", pkMode, "prefix:", pk.slice(0, 8));
console.log("allow test in prod:", process.env.STRIPE_ALLOW_TEST_IN_PRODUCTION);
console.log("app url:", process.env.NEXT_PUBLIC_APP_URL);
console.log("mode match:", skMode === pkMode || pkMode === "unset");

if (skMode === "test" && process.env.STRIPE_ALLOW_TEST_IN_PRODUCTION !== "true") {
  console.log("FAIL: need STRIPE_ALLOW_TEST_IN_PRODUCTION");
}
if (skMode !== pkMode && pk) {
  console.log("FAIL: sk/pk mode mismatch");
}
