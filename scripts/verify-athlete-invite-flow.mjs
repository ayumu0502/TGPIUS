/**
 * Full athlete invite flow verification (service role + admin impersonation).
 * Usage: node scripts/verify-athlete-invite-flow.mjs
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

const service = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  OK   ${label}`);
  passed++;
}

function fail(label, detail = "") {
  console.error(`  FAIL ${label}${detail ? `: ${detail}` : ""}`);
  failed++;
}

function assert(condition, label, detail = "") {
  if (condition) ok(label);
  else fail(label, detail);
}

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
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function cleanupProvisional(provisionalId, userId = null) {
  if (userId) {
    await service.auth.admin.deleteUser(userId);
  }
  await service.from("athlete_organization_memberships").delete().eq("provisional_profile_id", provisionalId);
  await service.from("athlete_invites").delete().eq("provisional_profile_id", provisionalId);
  await service.from("athlete_provisional_profiles").delete().eq("id", provisionalId);
}

async function main() {
  console.log("=== Athlete Invite Full Flow Verification ===\n");

  const { data: admin } = await service
    .from("profiles")
    .select("id, name")
    .eq("is_admin", true)
    .limit(1)
    .maybeSingle();

  if (!admin?.id) {
    console.error("FAIL: no admin user");
    process.exit(1);
  }

  const adminClient = await createUserClient(admin.id);
  const ts = Date.now();
  const inviteEmail = `verify-invite-${ts}@example.com`;
  const cancelEmail = `verify-cancel-${ts}@example.com`;

  // 1. 仮登録
  console.log("1. 管理者による仮登録");
  const { data: provisionalId, error: createError } = await adminClient.rpc(
    "admin_create_provisional_athlete",
    {
      p_email: inviteEmail,
      p_full_name: "Verify Invite Athlete",
      p_sport: "陸上",
      p_team: "Verify Team",
      p_review_status: "approved",
    }
  );
  assert(!createError && provisionalId, "admin_create_provisional_athlete", createError?.message);

  const { data: provRow } = await service
    .from("athlete_provisional_profiles")
    .select("linked_user_id")
    .eq("id", provisionalId)
    .single();
  assert(!provRow?.linked_user_id, "provisional has no linked user yet");

  // 2. 招待URL発行
  console.log("\n2. 招待URL発行");
  const { data: token1, error: sendError } = await adminClient.rpc(
    "admin_send_athlete_invite",
    { p_provisional_id: provisionalId }
  );
  assert(!sendError && token1, "admin_send_athlete_invite", sendError?.message);

  const { data: inviteAfterSend } = await service
    .from("athlete_invites")
    .select("status, sent_at")
    .eq("provisional_profile_id", provisionalId)
    .single();
  assert(inviteAfterSend?.status === "invited", "invite status is invited");
  assert(!!inviteAfterSend?.sent_at, "invite sent_at recorded");

  const { data: public1 } = await service.rpc("get_athlete_invite_public", {
    p_token: token1,
  });
  assert(public1?.[0]?.is_valid === true, "first token is valid");

  // 3. 招待の再送
  console.log("\n3. 招待の再送");
  const { data: token2, error: resendError } = await adminClient.rpc(
    "admin_send_athlete_invite",
    { p_provisional_id: provisionalId }
  );
  assert(!resendError && token2, "admin_send_athlete_invite (resend)", resendError?.message);
  assert(token2 !== token1, "resend issues new token");

  const { data: publicOld } = await service.rpc("get_athlete_invite_public", {
    p_token: token1,
  });
  assert(publicOld?.[0]?.is_valid !== true, "old token invalidated after resend");

  const { data: publicNew } = await service.rpc("get_athlete_invite_public", {
    p_token: token2,
  });
  assert(publicNew?.[0]?.is_valid === true, "new token is valid after resend");

  const { data: inviteAfterResend } = await service
    .from("athlete_invites")
    .select("resent_count")
    .eq("provisional_profile_id", provisionalId)
    .single();
  assert((inviteAfterResend?.resent_count ?? 0) >= 1, "resent_count incremented");

  // 4. 招待の取消（別レコード）
  console.log("\n4. 招待の取消");
  const { data: cancelProvId } = await adminClient.rpc("admin_create_provisional_athlete", {
    p_email: cancelEmail,
    p_full_name: "Cancel Test Athlete",
    p_sport: "水泳",
    p_review_status: "approved",
  });
  const { data: cancelToken } = await adminClient.rpc("admin_send_athlete_invite", {
    p_provisional_id: cancelProvId,
  });

  const { error: cancelError } = await adminClient.rpc("admin_cancel_athlete_invite", {
    p_provisional_id: cancelProvId,
  });
  assert(!cancelError, "admin_cancel_athlete_invite", cancelError?.message);

  const { data: cancelledInvite } = await service
    .from("athlete_invites")
    .select("status, cancelled_at")
    .eq("provisional_profile_id", cancelProvId)
    .single();
  assert(cancelledInvite?.status === "cancelled", "cancelled invite status");
  assert(!!cancelledInvite?.cancelled_at, "cancelled_at recorded");

  const { data: publicCancelled } = await service.rpc("get_athlete_invite_public", {
    p_token: cancelToken,
  });
  assert(publicCancelled?.[0]?.is_valid !== true, "cancelled token is invalid");

  await cleanupProvisional(cancelProvId);

  // 5. 選手本人が招待URLから登録
  console.log("\n5. 選手本人の招待URL登録");
  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email: inviteEmail,
    email_confirm: true,
    password: "TestPass123!",
    user_metadata: { name: "Verify Invite Athlete", account_type: "athlete" },
  });
  assert(!authError && authUser?.user?.id, "create auth user", authError?.message);

  await service.from("profiles").upsert({
    id: authUser.user.id,
    name: "Verify Invite Athlete",
    email: inviteEmail,
    account_type: "athlete",
    athlete_review_status: "not_applied",
  });

  const { error: completeError } = await service.rpc(
    "complete_athlete_invite_registration",
    { p_token: token2, p_user_id: authUser.user.id }
  );
  assert(!completeError, "complete_athlete_invite_registration", completeError?.message);

  // 6. 仮プロフィールと本人アカウントの紐付け
  console.log("\n6. 仮プロフィール紐付け");
  const { data: linkedProv } = await service
    .from("athlete_provisional_profiles")
    .select("linked_user_id, sport, review_status")
    .eq("id", provisionalId)
    .single();
  assert(linkedProv?.linked_user_id === authUser.user.id, "provisional linked_user_id set");

  const { data: linkedProfile } = await service
    .from("profiles")
    .select("sport, athlete_review_status, invited_via_provisional_id, team")
    .eq("id", authUser.user.id)
    .single();
  assert(linkedProfile?.sport === "陸上", "profile sport copied from provisional");
  assert(linkedProfile?.team === "Verify Team", "profile team copied");
  assert(
    linkedProfile?.invited_via_provisional_id === provisionalId,
    "invited_via_provisional_id set"
  );
  assert(linkedProfile?.athlete_review_status === "approved", "review status copied");

  // 7. 登録完了ステータス
  console.log("\n7. 登録完了ステータス");
  const { data: completedInvite } = await service
    .from("athlete_invites")
    .select("status, completed_at")
    .eq("provisional_profile_id", provisionalId)
    .single();
  assert(completedInvite?.status === "completed", "invite status completed");
  assert(!!completedInvite?.completed_at, "completed_at recorded");

  const { data: publicCompleted } = await service.rpc("get_athlete_invite_public", {
    p_token: token2,
  });
  assert(publicCompleted?.[0]?.is_valid !== true, "completed token no longer valid");

  // cleanup
  await service.auth.admin.deleteUser(authUser.user.id);
  await cleanupProvisional(provisionalId);

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
  console.log("All invite flow steps passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
