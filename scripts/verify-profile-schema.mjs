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

const columns = [
  "avatar_url",
  "sport",
  "team",
  "region",
  "bio",
  "achievements",
  "goals",
  "instagram_url",
  "tiktok_url",
  "x_url",
];

console.log("プロフィール拡張カラム確認\n");

for (const col of columns) {
  const res = await fetch(
    `${url}/rest/v1/profiles?select=${col}&limit=0`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }
  );

  const ok = res.status === 200 || res.status === 206;
  console.log(`${ok ? "OK" : "NG"}  ${col} (HTTP ${res.status})`);
  if (!ok) {
    const body = await res.text();
    console.error("  ", body.slice(0, 120));
    process.exit(1);
  }
}

const bucketRes = await fetch(`${url}/storage/v1/bucket/avatars`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});

if (bucketRes.ok) {
  console.log("\nOK  Storage: avatars");
} else {
  console.error("\nFAIL: avatars バケットが見つかりません");
  process.exit(1);
}

console.log("\nDB・Storage の準備は完了しています。");
