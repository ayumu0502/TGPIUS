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

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

if (!url || !key) fail(".env.local が未設定です");

async function checkTable(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return res.status !== 404 && res.status !== 406;
}

console.log("投稿機能セットアップ確認\n");

const tables = ["posts", "likes", "comments"];
for (const table of tables) {
  const ok = await checkTable(table);
  console.log(`${ok ? "OK" : "NG"}  テーブル: ${table}`);
  if (!ok) fail(`${table} テーブルにアクセスできません`);
}

const bucketRes = await fetch(`${url}/storage/v1/bucket/post-media`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});

if (bucketRes.ok) {
  console.log("OK  Storage: post-media");
} else {
  fail("post-media バケットが見つかりません");
}

console.log("\nすべての準備が完了しています。");
console.log("次: http://localhost:3000/post/new から投稿をテストしてください。");
