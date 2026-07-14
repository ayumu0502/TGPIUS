/**
 * Deploy TGPIUS to Vercel with env vars from .env.local (no values logged).
 * Prereq: `npx vercel login` completed
 * Usage: node scripts/vercel-deploy.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const ENV_FILE = resolve(ROOT, ".env.local");

const EXTRA_ENV = {
  STRIPE_PLATFORM_FEE_RATE: "0.1",
  STRIPE_ALLOW_TEST_IN_PRODUCTION: "true",
};

function parseEnvFile(path) {
  if (!existsSync(path)) throw new Error(".env.local not found");
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (value) vars[key] = value;
  }
  return vars;
}

function run(cmd, args, input) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`
    );
  }
  return result.stdout?.trim() ?? "";
}

function vercel(...args) {
  return run("npx", ["vercel", ...args]);
}

function vercelWithInput(input, ...args) {
  const result = spawnSync("npx", ["vercel", ...args], {
    cwd: ROOT,
    input: `${input}\n`,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    const msg = result.stderr || result.stdout || "";
    if (/already exists|Environment Variable/i.test(msg)) return msg;
    throw new Error(`vercel ${args.join(" ")} failed:\n${msg}`);
  }
  return result.stdout?.trim() ?? "";
}

async function main() {
  console.log("Checking Vercel login...");
  try {
    const who = vercel("whoami");
    console.log(`Logged in as: ${who}`);
  } catch {
    console.error("Not logged in. Run: npx vercel login");
    process.exit(1);
  }

  const local = parseEnvFile(ENV_FILE);
  const all = { ...local, ...EXTRA_ENV };

  // Skip empty webhook for now
  delete all.STRIPE_WEBHOOK_SECRET;

  console.log("Linking project...");
  try {
    vercel("link", "--yes", "--project", "tgpius");
  } catch {
    vercel("link", "--yes");
  }

  console.log("Setting environment variables (production)...");
  const keys = Object.keys(all);
  for (const key of keys) {
    if (key === "NEXT_PUBLIC_APP_URL" && all[key].includes("localhost")) {
      all[key] = "https://tgpius.vercel.app";
    }
    try {
      vercelWithInput(`${all[key]}\n`, "env", "add", key, "production", "--force");
      console.log(`  OK ${key}`);
    } catch (e) {
      console.log(`  SKIP ${key} (may exist)`);
    }
  }

  console.log("Deploying to production...");
  const output = vercel("deploy", "--prod", "--yes");
  console.log(output);

  const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/g);
  if (urlMatch?.length) {
    const url = urlMatch[urlMatch.length - 1];
    console.log(`\nProduction URL: ${url}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
