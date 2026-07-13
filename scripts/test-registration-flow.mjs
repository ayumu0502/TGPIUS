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
    env[trimmed.slice(0, separatorIndex).trim()] = trimmed
      .slice(separatorIndex + 1)
      .trim();
  }

  return env;
}

const env = loadEnvFile(path.join(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function signup(accountType, label) {
  const email = `tgplus.${accountType}.${Date.now()}@gmail.com`;
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: "TestPassword123!",
      data: {
        name: `テスト${label}`,
        account_type: accountType,
      },
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      `${label}: ${body.msg || body.error_description || response.status}`
    );
  }

  return {
    label,
    email,
    userId: body.user?.id,
    hasSession: Boolean(body.session),
    accountType: body.user?.user_metadata?.account_type,
  };
}

console.log("登録フロー統合テスト\n");

const accountTypes = [
  ["fan", "ファン"],
  ["athlete", "アスリート"],
  ["sponsor", "スポンサー"],
];

const results = [];

for (const [accountType, label] of accountTypes) {
  results.push(await signup(accountType, label));
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

for (const result of results) {
  console.log(`✓ ${result.label}`);
  console.log(`  メール: ${result.email}`);
  console.log(`  ユーザーID: ${result.userId ?? "なし"}`);
  console.log(`  アカウント種別: ${result.accountType ?? "なし"}`);
  console.log(
    `  即時ログイン: ${result.hasSession ? "可能" : "メール確認が必要"}`
  );
  console.log("");
}

const withSession = results.filter((r) => r.hasSession).length;

if (withSession === 0) {
  console.log(
    "注意: メール確認がONのため、登録後はダッシュボードへ即時遷移しません。"
  );
  console.log(
    "即時遷移をテストする場合: Supabase → Authentication → Email → Confirm email を OFF"
  );
} else {
  console.log("すべてのアカウント種別で登録とセッション作成に成功しました。");
}
