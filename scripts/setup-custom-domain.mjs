/**
 * Prepare custom domain tgplus.jp on Vercel project tgpius.
 * Usage: node scripts/setup-custom-domain.mjs
 *
 * Note: Domain purchase and DNS changes at your registrar are manual steps.
 */
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DOMAINS = ["tgplus.jp", "www.tgplus.jp"];
const PROJECT = "tgpius";
const PRODUCTION_URL = "https://tgplus.jp";

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function vercel(...args) {
  return run("npx", ["vercel", ...args]);
}

console.log("=== TGPLUS Custom Domain Setup ===\n");

const who = vercel("whoami");
if (!who.ok) {
  console.error("Vercel CLI にログインしてください: npx vercel login");
  process.exit(1);
}
console.log(`Vercel user: ${who.stdout}\n`);

console.log("Linking project...");
vercel("link", "--yes", "--project", PROJECT);

console.log("\n--- Adding domains to Vercel (if permitted) ---\n");
for (const domain of DOMAINS) {
  const add = vercel("domains", "add", domain, PROJECT);
  if (add.ok) {
    console.log(`OK   added ${domain}`);
  } else {
    const msg = add.stderr || add.stdout;
    if (/already|exists|assigned/i.test(msg)) {
      console.log(`OK   ${domain} (already configured)`);
    } else {
      console.log(`SKIP ${domain}: ${msg.split("\n")[0]}`);
    }
  }
}

console.log("\n--- DNS records to configure at your domain registrar ---\n");
console.log("After purchasing tgplus.jp, add these records:\n");
console.log("1) Apex domain tgplus.jp");
console.log("   Type: A");
console.log("   Name: @ (or leave blank)");
console.log("   Value: 76.76.21.21");
console.log("");
console.log("2) www subdomain www.tgplus.jp");
console.log("   Type: CNAME");
console.log("   Name: www");
console.log("   Value: cname.vercel-dns.com");
console.log("");
console.log("Vercel Dashboard > Project tgpius > Settings > Domains で");
console.log("表示される指示が優先です。上記は一般的な Vercel 向け設定です。\n");

console.log("--- Redirect behavior (configured in vercel.json) ---\n");
console.log("- www.tgplus.jp -> https://tgplus.jp (301)");
console.log("- tgpius.vercel.app -> https://tgplus.jp (301)");
console.log("  ※ tgplus.jp の DNS が有効化されるまで、旧URLリダイレクトは未検証です。\n");

console.log("--- Set production URL env var ---\n");
console.log(`NEXT_PUBLIC_APP_URL=${PRODUCTION_URL}`);
console.log("Run: npx vercel env add NEXT_PUBLIC_APP_URL production");
console.log("Or use: node scripts/vercel-deploy.mjs\n");

console.log("Done. Complete DNS at your registrar, then wait for propagation.");
