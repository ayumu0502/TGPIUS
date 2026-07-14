/**
 * Probe gift-related DB state and run E2E gift send test.
 * Does not print secrets or full emails.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const service = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUserClient(userId) {
  const { data: profile } = await service
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.email) throw new Error("USER_EMAIL_NOT_FOUND");

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: profile.email,
  });
  if (linkError) throw new Error(linkError.message);

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) throw new Error("NO_TOKEN_HASH");

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: verifyError } = await authClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (verifyError || !authData.session?.access_token) {
    throw new Error(verifyError?.message ?? "NO_SESSION");
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
  });
}

async function probe() {
  const { data: fans } = await service
    .from("profiles")
    .select("id, name, point_balance")
    .eq("account_type", "fan")
    .order("point_balance", { ascending: false })
    .limit(5);

  const { data: athletes } = await service
    .from("profiles")
    .select("id, name")
    .eq("account_type", "athlete")
    .limit(5);

  console.log("fans", (fans ?? []).map((f) => ({
    id: f.id.slice(0, 8) + "...",
    name: f.name,
    balance: f.point_balance,
  })));
  console.log("athletes", (athletes ?? []).map((a) => ({
    id: a.id.slice(0, 8) + "...",
    name: a.name,
  })));

  return { fans: fans ?? [], athletes: athletes ?? [] };
}

async function testGiftSend(fanId, athleteId, amount, idempotencyKey) {
  const userClient = await createUserClient(fanId);

  const { data: beforeFan } = await service
    .from("profiles")
    .select("point_balance")
    .eq("id", fanId)
    .single();
  const { data: beforeAthlete } = await service
    .from("profiles")
    .select("earnings_balance")
    .eq("id", athleteId)
    .maybeSingle();

  const rpcArgs = {
    p_receiver_id: athleteId,
    p_amount: amount,
    p_message: "E2E test gift",
    p_idempotency_key: idempotencyKey,
  };

  let { data: giftId, error } = await userClient.rpc("send_gift", rpcArgs);

  if (error && idempotencyKey && /p_idempotency_key|send_gift\(/i.test(error.message)) {
    ({ data: giftId, error } = await userClient.rpc("send_gift", {
      p_receiver_id: athleteId,
      p_amount: amount,
      p_message: "E2E test gift",
    }));
  }

  if (error) {
    return { ok: false, reason: error.message };
  }

  const { data: afterFan } = await service
    .from("profiles")
    .select("point_balance")
    .eq("id", fanId)
    .single();
  const { data: afterAthlete } = await service
    .from("profiles")
    .select("earnings_balance")
    .eq("id", athleteId)
    .maybeSingle();

  const fanDelta = (beforeFan?.point_balance ?? 0) - (afterFan?.point_balance ?? 0);
  const earningsDelta =
    (afterAthlete?.earnings_balance ?? 0) - (beforeAthlete?.earnings_balance ?? 0);

  return {
    ok: true,
    giftId,
    fanDelta,
    earningsDelta,
    expectedNet: amount - Math.floor(amount * 0.1),
    beforeBalance: beforeFan?.point_balance,
    afterBalance: afterFan?.point_balance,
    beforeEarnings: beforeAthlete?.earnings_balance,
    afterEarnings: afterAthlete?.earnings_balance,
  };
}

async function testIdempotency(fanId, athleteId, amount, key) {
  const first = await testGiftSend(fanId, athleteId, amount, key);
  if (!first.ok) return { first, second: null };

  const before = await service
    .from("profiles")
    .select("point_balance")
    .eq("id", fanId)
    .single();

  const second = await testGiftSend(fanId, athleteId, amount, key);
  const after = await service
    .from("profiles")
    .select("point_balance")
    .eq("id", fanId)
    .single();

  return {
    first,
    second,
    balanceUnchangedOnRetry: before.data?.point_balance === after.data?.point_balance,
    sameGiftId: first.giftId === second.giftId,
  };
}

async function main() {
  const { fans, athletes } = await probe();
  if (fans.length === 0 || athletes.length === 0) {
    console.error("Need at least one fan and one athlete");
    process.exit(1);
  }

  const fan = fans.find((f) => (f.point_balance ?? 0) >= 100) ?? fans[0];
  const athlete = athletes[0];
  const amount = 100;

  if ((fan.point_balance ?? 0) < amount) {
    console.log("SKIP_SEND: fan balance too low", fan.point_balance);
    process.exit(0);
  }

  console.log("\n--- gift send test ---");
  const sendResult = await testGiftSend(
    fan.id,
    athlete.id,
    amount,
    `e2e-${Date.now()}`
  );
  console.log(sendResult);

  console.log("\n--- idempotency test ---");
  const idemKey = `idem-${Date.now()}`;
  const idemResult = await testIdempotency(fan.id, athlete.id, amount, idemKey);
  console.log({
    firstOk: idemResult.first?.ok,
    secondOk: idemResult.second?.ok,
    sameGiftId: idemResult.sameGiftId,
    balanceUnchangedOnRetry: idemResult.balanceUnchangedOnRetry,
  });

  console.log("\n--- insufficient balance test ---");
  const brokeFan = fans.find((f) => (f.point_balance ?? 0) < 50);
  if (brokeFan) {
    const fail = await testGiftSend(brokeFan.id, athlete.id, 10000, `fail-${Date.now()}`);
    console.log({ expectedFail: !fail.ok, reason: fail.reason?.slice(0, 80) });
  } else {
    console.log("skipped: no low-balance fan");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
