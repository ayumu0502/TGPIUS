import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnvFile(path.join(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("FAIL: .env.local が未設定です");
  process.exit(1);
}

console.log("管理者スキーマ確認\n");

const adminColRes = await fetch(
  `${url}/rest/v1/profiles?select=is_admin,is_suspended&limit=0`,
  {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }
);

if (adminColRes.status === 200 || adminColRes.status === 206) {
  console.log("OK  profiles.is_admin / is_suspended");
} else {
  console.error("FAIL: 管理者カラムがありません");
  process.exit(1);
}

console.log("\nDB の準備は完了しています。");
console.log("管理者にする:");
console.log("  update public.profiles set is_admin = true where email = 'your@email.com';");
