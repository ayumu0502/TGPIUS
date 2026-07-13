import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

const envPath = path.join(process.cwd(), ".env.local");
const env = loadEnvFile(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!url || url.length < 10) {
  fail(".env.local の NEXT_PUBLIC_SUPABASE_URL が未設定です");
}

if (!key || key.length < 20 || key.includes("貼り付け")) {
  fail(".env.local の NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です");
}

console.log("1/3 環境変数 .......... OK");
console.log(`    URL: ${url}`);

const healthResponse = await fetch(`${url}/auth/v1/health`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
});

if (!healthResponse.ok) {
  fail(`Supabase 接続失敗 (HTTP ${healthResponse.status})`);
}

console.log("2/3 Supabase 接続 .... OK");

const testEmail = `tgplus.test.${Date.now()}@gmail.com`;
const testPassword = "TestPassword123!";
const testName = "テストユーザー";

const signupResponse = await fetch(`${url}/auth/v1/signup`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: testEmail,
    password: testPassword,
    data: {
      name: testName,
      account_type: "fan",
    },
  }),
});

const signupBody = await signupResponse.json();

if (!signupResponse.ok) {
  fail(
    `登録APIテスト失敗: ${signupBody.msg || signupBody.error_description || signupResponse.status}`
  );
}

console.log("3/3 登録APIテスト ...... OK");
console.log(`    テストユーザー: ${testEmail}`);

if (signupBody.user?.id) {
  console.log(`    ユーザーID: ${signupBody.user.id}`);
}

if (signupBody.session) {
  console.log("    セッション: 作成済み（即時ログイン可能）");
} else {
  console.log("    セッション: なし（メール確認が必要な設定です）");
}

console.log("\nすべての接続テストに成功しました。");
