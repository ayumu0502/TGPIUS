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

console.log("ギフト機能スキーマ確認\n");

const profileRes = await fetch(
  `${url}/rest/v1/profiles?select=point_balance&limit=0`,
  {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }
);

if (profileRes.status === 200 || profileRes.status === 206) {
  console.log("OK  profiles.point_balance");
} else {
  console.error("FAIL: point_balance カラムがありません");
  process.exit(1);
}

const giftsRes = await fetch(`${url}/rest/v1/gifts?select=id&limit=0`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});

if (giftsRes.status === 200 || giftsRes.status === 206) {
  console.log("OK  gifts テーブル");
} else {
  console.error("FAIL: gifts テーブルがありません");
  process.exit(1);
}

console.log("\nDB の準備は完了しています。");
console.log("Supabase SQL Editor で supabase/gifts-schema.sql を実行してください。");
