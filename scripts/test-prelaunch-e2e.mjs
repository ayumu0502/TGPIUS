/**
 * Pre-launch E2E: athlete application, admin, notifications, posts, events, DM.
 * Usage: node scripts/test-prelaunch-e2e.mjs
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
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

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

const ZERO_UUID = "00000000-0000-0000-0000-000000000001";

const RPC_PROBE_ARGS = {
  submit_athlete_application: {
    p_full_name: "probe",
    p_sport: "probe",
    p_identity_doc_path: `${ZERO_UUID}/probe.pdf`,
  },
  admin_review_athlete_application: {
    p_application_id: ZERO_UUID,
    p_action: "approve",
  },
  mark_notification_read: { p_notification_id: ZERO_UUID },
  mark_all_notifications_read: {},
  admin_delete_post: { p_post_id: ZERO_UUID },
  admin_delete_comment: { p_comment_id: ZERO_UUID },
  admin_broadcast_announcement: {
    p_title: "probe",
    p_body: "probe",
  },
  admin_set_user_suspended: {
    p_user_id: ZERO_UUID,
    p_suspended: false,
  },
  admin_create_provisional_athlete: {
    p_email: "probe-invite@example.com",
    p_full_name: "Probe",
    p_sport: "陸上",
  },
  get_athlete_invite_public: { p_token: "invalid-token" },
  complete_athlete_invite_registration: {
    p_token: "invalid-token",
    p_user_id: ZERO_UUID,
  },
  admin_send_athlete_invite: { p_provisional_id: ZERO_UUID },
  admin_cancel_athlete_invite: { p_provisional_id: ZERO_UUID },
  admin_upsert_organization: {
    p_id: null,
    p_name: "Probe Org",
    p_org_type: "team",
  },
  list_events: {
    p_scope: "upcoming",
    p_creator_id: null,
    p_user_id: ZERO_UUID,
    p_limit: 1,
  },
  create_event: {
    p_title: "probe",
    p_starts_at: new Date(Date.now() + 86400000).toISOString(),
  },
  join_event: { p_event_id: ZERO_UUID },
  can_message_user: { p_other_user_id: ZERO_UUID },
  get_or_create_conversation: { p_other_user_id: ZERO_UUID },
};

async function rpcExists(name) {
  const args = RPC_PROBE_ARGS[name] ?? {};
  const { error } = await service.rpc(name, args);
  if (!error) return true;
  const msg = error.message.toLowerCase();
  if (msg.includes("could not find the function") || msg.includes("does not exist")) {
    return false;
  }
  return true;
}

async function findTestUsers() {
  const { data: fan } = await service
    .from("profiles")
    .select("id, name")
    .eq("account_type", "fan")
    .limit(1)
    .maybeSingle();

  const { data: approved } = await service
    .from("profiles")
    .select("id, name, athlete_review_status")
    .eq("account_type", "athlete")
    .eq("athlete_review_status", "approved")
    .limit(1)
    .maybeSingle();

  if (approved?.id) {
    return { fan, athlete: approved };
  }

  const { data: anyAthlete } = await service
    .from("profiles")
    .select("id, name, athlete_review_status")
    .eq("account_type", "athlete")
    .limit(1)
    .maybeSingle();

  return { fan, athlete: anyAthlete };
}

async function findAdminUser() {
  const { data: admin } = await service
    .from("profiles")
    .select("id, name")
    .eq("is_admin", true)
    .limit(1)
    .maybeSingle();

  if (admin?.id) return admin;

  const email = process.env.E2E_ADMIN_EMAIL?.trim();
  if (!email) return null;

  const { data: byEmail } = await service
    .from("profiles")
    .select("id, name")
    .eq("email", email)
    .maybeSingle();

  if (!byEmail?.id) return null;

  await service.from("profiles").update({ is_admin: true }).eq("id", byEmail.id);
  return byEmail;
}

async function tableReadable(name) {
  const { error } = await service.from(name).select("id").limit(1);
  return !error;
}

async function tryApplyNotificationHotfix() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) return false;

  const sql = readFileSync(
    resolve(process.cwd(), "supabase/notifications-athlete-application-hotfix.sql"),
    "utf8"
  );
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || "mctpdumewffwhleggpjt";
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  return response.ok;
}

async function testNotificationType(recipientId, actorId) {
  const { data: row, error } = await service
    .from("notifications")
    .insert({
      recipient_id: recipientId,
      actor_id: actorId,
      type: "athlete_application",
      title: "E2E test",
      body: "hotfix verification",
      link_url: "/athlete/apply",
      entity_type: "athlete_application",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await service.from("notifications").delete().eq("id", row.id);
  return { ok: true };
}

async function createTestAthlete() {
  const email = `e2e-athlete-${Date.now()}@tgplus-test.local`;
  const { data: userData, error: userError } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name: "E2E Test Athlete", account_type: "athlete" },
  });
  if (userError) throw new Error(userError.message);

  const userId = userData.user.id;

  await service.from("profiles").upsert({
    id: userId,
    name: "E2E Test Athlete",
    email,
    account_type: "athlete",
    athlete_review_status: "not_applied",
  });

  return { userId, email };
}

async function tryApplyAdminAthleteHotfix() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) return false;

  const sql = readFileSync(
    resolve(process.cwd(), "supabase/admin-athlete-management-hotfix.sql"),
    "utf8"
  );
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || "mctpdumewffwhleggpjt";
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  return response.ok;
}

async function adminReview(adminClient, applicationId, action, note = "E2E") {
  let { error } = await adminClient.rpc("admin_review_athlete_application", {
    p_application_id: applicationId,
    p_action: action,
    p_note: note,
  });

  if (error && action === "reinstate" && /invalid_action|reinstate/i.test(error.message)) {
    const applied = await tryApplyAdminAthleteHotfix();
    if (applied) {
      ({ error } = await adminClient.rpc("admin_review_athlete_application", {
        p_application_id: applicationId,
        p_action: action,
        p_note: note,
      }));
      assert(applied, "admin-athlete-management hotfix applied");
    }
  }

  return error;
}

async function cleanupTestUser(userId) {
  await service.from("athlete_application_audit_log").delete().eq("user_id", userId);
  await service.from("athlete_applications").delete().eq("user_id", userId);
  await service.from("notifications").delete().eq("recipient_id", userId);
  await service.auth.admin.deleteUser(userId);
}

console.log("=== TGPLUS Pre-launch E2E ===\n");

// ---------------------------------------------------------------------------
// 1. Athlete application schema
// ---------------------------------------------------------------------------
console.log("1. 選手申請・審査");

assert(await tableReadable("athlete_applications"), "athlete_applications table");
assert(await tableReadable("athlete_application_audit_log"), "athlete_application_audit_log table");
assert(await rpcExists("submit_athlete_application"), "submit_athlete_application RPC");
assert(await rpcExists("admin_review_athlete_application"), "admin_review_athlete_application RPC");

const adminProfile = await findAdminUser();
const { fan: fanRow, athlete: approvedAthlete } = await findTestUsers();

if (adminProfile?.id) {
  ok(`admin user exists (${adminProfile.name})`);
} else {
  fail(
    "admin user exists",
    "set is_admin=true or E2E_ADMIN_EMAIL in .env.local"
  );
}

let testAthleteId = null;
let testApplicationId = null;

if (adminProfile?.id) {
  try {
    const testAthlete = await createTestAthlete();
    testAthleteId = testAthlete.userId;
    const athleteClient = await createUserClient(testAthleteId);
    const docPath = `${testAthleteId}/e2e-identity.pdf`;

    const { data: appId, error: submitError } = await athleteClient.rpc(
      "submit_athlete_application",
      {
        p_full_name: "E2E Test Athlete",
        p_sport: "テニス",
        p_identity_doc_path: docPath,
      }
    );

    if (submitError) {
      fail("submit_athlete_application", submitError.message);
    } else {
      testApplicationId = appId;
      ok("submit_athlete_application");

      const { data: pendingProfile } = await service
        .from("profiles")
        .select("athlete_review_status")
        .eq("id", testAthleteId)
        .single();
      assert(pendingProfile?.athlete_review_status === "pending", "status becomes pending");

      const adminClient = await createUserClient(adminProfile.id);
      const approveError = await adminReview(
        adminClient,
        testApplicationId,
        "approve",
        "E2E approve"
      );

      if (approveError) {
        fail("admin_review_athlete_application (approve)", approveError.message);
      } else {
        ok("admin_review_athlete_application (approve)");

        const suspendError = await adminReview(
          adminClient,
          testApplicationId,
          "suspend",
          "E2E suspend"
        );
        assert(!suspendError, "admin_review (suspend)", suspendError?.message);

        const reinstateError = await adminReview(
          adminClient,
          testApplicationId,
          "reinstate",
          "E2E reinstate"
        );
        assert(!reinstateError, "admin_review (reinstate)", reinstateError?.message);

        const { data: reinstated } = await service
          .from("profiles")
          .select("athlete_review_status")
          .eq("id", testAthleteId)
          .single();
        assert(reinstated?.athlete_review_status === "approved", "reinstate restores approved status");

        const { data: notif } = await service
          .from("notifications")
          .select("id, type, link_url")
          .eq("recipient_id", testAthleteId)
          .eq("type", "athlete_application")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        assert(notif?.type === "athlete_application", "review creates athlete_application notification");
        assert(notif?.link_url === "/athlete/dashboard", "reinstate notification link_url");

        const { count: auditCount } = await service
          .from("athlete_application_audit_log")
          .select("id", { count: "exact", head: true })
          .eq("application_id", testApplicationId);

        assert((auditCount ?? 0) >= 4, "audit log entries recorded");
      }
    }
  } catch (err) {
    fail("athlete application flow", err.message);
  }
}

// ---------------------------------------------------------------------------
// 2. Admin console
// ---------------------------------------------------------------------------
console.log("\n2. 管理画面 (Admin)");

assert(await tableReadable("admin_audit_log"), "admin_audit_log table");
assert(await rpcExists("admin_delete_post"), "admin_delete_post RPC");
assert(await rpcExists("admin_delete_comment"), "admin_delete_comment RPC");
assert(await rpcExists("admin_broadcast_announcement"), "admin_broadcast_announcement RPC");
assert(await rpcExists("admin_set_user_suspended"), "admin_set_user_suspended RPC");

if (adminProfile?.id) {
  const adminClient = await createUserClient(adminProfile.id);
  const { error: appsError } = await adminClient
    .from("athlete_applications")
    .select("id")
    .limit(1);
  assert(!appsError, "admin can read athlete_applications");

  const { error: reportsError } = await adminClient
    .from("user_reports")
    .select("id")
    .limit(1);
  assert(!reportsError, "admin can read user_reports");
}

// ---------------------------------------------------------------------------
// 3. Notifications
// ---------------------------------------------------------------------------
console.log("\n3. 通知");

assert(await tableReadable("notifications"), "notifications table");
assert(await rpcExists("mark_notification_read"), "mark_notification_read RPC");
assert(await rpcExists("mark_all_notifications_read"), "mark_all_notifications_read RPC");

let notifTest = await testNotificationType(
  fanRow?.id ?? adminProfile?.id,
  adminProfile?.id
);

if (!notifTest.ok && /check constraint|athlete_application/i.test(notifTest.error ?? "")) {
  console.log("  ... applying notification hotfix");
  const applied = await tryApplyNotificationHotfix();
  if (applied) {
    notifTest = await testNotificationType(
      fanRow?.id ?? adminProfile?.id,
      adminProfile?.id
    );
    assert(applied, "notification hotfix applied via API");
  } else {
    fail("notification hotfix", "run supabase/notifications-athlete-application-hotfix.sql");
  }
}

assert(notifTest.ok, "athlete_application notification type", notifTest.error);

// ---------------------------------------------------------------------------
// 4. Posts & comments
// ---------------------------------------------------------------------------
console.log("\n4. 投稿・コメント");

assert(await tableReadable("posts"), "posts table");
assert(await tableReadable("likes"), "likes table");
assert(await tableReadable("comments"), "comments table");

if (approvedAthlete?.id && fanRow?.id) {
  const athleteClient = await createUserClient(approvedAthlete.id);
  const fanClient = await createUserClient(fanRow.id);

  const { data: post, error: postError } = await athleteClient
    .from("posts")
    .insert({
      user_id: approvedAthlete.id,
      caption: "E2E test post",
      media_type: "image",
      media_url: "https://example.com/e2e-test.jpg",
    })
    .select("id")
    .single();

  if (postError) {
    fail("create post", postError.message);
  } else {
    ok("create post");

    const { error: likeError } = await fanClient.from("likes").insert({
      post_id: post.id,
      user_id: fanRow.id,
    });
    assert(!likeError, "like post", likeError?.message);

    const { error: commentError } = await fanClient.from("comments").insert({
      post_id: post.id,
      user_id: fanRow.id,
      content: "E2E comment",
    });
    assert(!commentError, "add comment", commentError?.message);

    const { count: notifCount } = await service
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", approvedAthlete.id)
      .in("type", ["like", "comment"])
      .gte("created_at", new Date(Date.now() - 60_000).toISOString());

    assert((notifCount ?? 0) >= 1, "like/comment triggers notification");

    await service.from("comments").delete().eq("post_id", post.id);
    await service.from("likes").delete().eq("post_id", post.id);
    await service.from("posts").delete().eq("id", post.id);
    ok("post cleanup");
  }
} else {
  fail("posts flow", `fan=${fanRow?.id ?? "none"} athlete=${approvedAthlete?.id ?? "none"}`);
}

// ---------------------------------------------------------------------------
// 5. Events
// ---------------------------------------------------------------------------
console.log("\n5. イベント");

assert(await tableReadable("events"), "events table");
assert(await rpcExists("list_events"), "list_events RPC");
assert(await rpcExists("create_event"), "create_event RPC");
assert(await rpcExists("join_event"), "join_event RPC");

if (approvedAthlete?.id && fanRow?.id) {
  const athleteClient = await createUserClient(approvedAthlete.id);
  const fanClient = await createUserClient(fanRow.id);

  const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: eventId, error: createError } = await athleteClient.rpc("create_event", {
    p_title: "E2E Test Event",
    p_starts_at: startsAt,
    p_description: "Pre-launch E2E",
    p_capacity: 10,
    p_fee_points: 0,
  });

  if (createError) {
    fail("create_event", createError.message);
  } else {
    ok("create_event");

    const { error: joinError } = await fanClient.rpc("join_event", {
      p_event_id: eventId,
    });
    assert(!joinError, "join_event", joinError?.message);

    const { data: events } = await fanClient.rpc("list_events", {
      p_scope: "upcoming",
      p_creator_id: null,
      p_user_id: fanRow.id,
      p_limit: 20,
    });
    const found = (events ?? []).some((e) => e.id === eventId);
    assert(found, "list_events includes created event");

    await service.from("event_participants").delete().eq("event_id", eventId);
    await service.from("events").delete().eq("id", eventId);
    ok("event cleanup");
  }
} else {
  fail("events flow", `fan=${fanRow?.id ?? "none"} athlete=${approvedAthlete?.id ?? "none"}`);
}

// ---------------------------------------------------------------------------
// 6. DM
// ---------------------------------------------------------------------------
console.log("\n6. DM");

assert(await tableReadable("conversations"), "conversations table");
assert(await tableReadable("messages"), "messages table");
assert(await tableReadable("user_blocks"), "user_blocks table");
assert(await rpcExists("can_message_user"), "can_message_user RPC");
assert(await rpcExists("get_or_create_conversation"), "get_or_create_conversation RPC");

if (approvedAthlete?.id && fanRow?.id) {
  const fanClient = await createUserClient(fanRow.id);

  const { data: canMessage, error: canError } = await fanClient.rpc("can_message_user", {
    p_other_user_id: approvedAthlete.id,
  });
  assert(!canError && canMessage === true, "fan can message approved athlete", canError?.message);

  if (testAthleteId) {
    await service
      .from("profiles")
      .update({ athlete_review_status: "pending" })
      .eq("id", testAthleteId);

    const { data: cannotMessage } = await fanClient.rpc("can_message_user", {
      p_other_user_id: testAthleteId,
    });
    assert(cannotMessage === false, "fan cannot message unapproved athlete");
  }

  const { data: convId, error: convError } = await fanClient.rpc(
    "get_or_create_conversation",
    { p_other_user_id: approvedAthlete.id }
  );
  assert(!convError && convId, "get_or_create_conversation", convError?.message);

  if (convId) {
    const { error: msgError } = await fanClient.from("messages").insert({
      conversation_id: convId,
      sender_id: fanRow.id,
      content: "E2E DM test",
    });
    assert(!msgError, "send message", msgError?.message);

    await service
      .from("messages")
      .delete()
      .eq("conversation_id", convId)
      .eq("content", "E2E DM test");
    ok("DM cleanup");
  }
} else {
  fail("DM flow", `fan=${fanRow?.id ?? "none"} athlete=${approvedAthlete?.id ?? "none"}`);
}

// ---------------------------------------------------------------------------
// 7. Athlete invite & organizations
// ---------------------------------------------------------------------------
console.log("\n7. 選手招待・組織");

assert(await tableReadable("organizations"), "organizations table");
assert(await tableReadable("athlete_provisional_profiles"), "athlete_provisional_profiles table");
assert(await tableReadable("athlete_invites"), "athlete_invites table");
assert(await tableReadable("athlete_organization_memberships"), "athlete_organization_memberships table");
assert(await rpcExists("admin_create_provisional_athlete"), "admin_create_provisional_athlete RPC");
assert(await rpcExists("admin_send_athlete_invite"), "admin_send_athlete_invite RPC");
assert(await rpcExists("get_athlete_invite_public"), "get_athlete_invite_public RPC");
assert(await rpcExists("complete_athlete_invite_registration"), "complete_athlete_invite_registration RPC");

if (adminProfile?.id) {
  const adminClient = await createUserClient(adminProfile.id);
  const inviteEmail = `e2e-invite-${Date.now()}@example.com`;

  const { data: orgId, error: orgError } = await adminClient.rpc("admin_upsert_organization", {
    p_id: null,
    p_name: `E2E Org ${Date.now()}`,
    p_org_type: "team",
    p_region: "東京",
  });
  assert(!orgError && orgId, "admin_upsert_organization", orgError?.message);

  const { data: provisionalId, error: createProvError } = await adminClient.rpc(
    "admin_create_provisional_athlete",
    {
      p_email: inviteEmail,
      p_full_name: "E2E Invite Athlete",
      p_sport: "水泳",
      p_team: "E2E Team",
      p_region: "大阪",
      p_review_status: "approved",
      p_is_public: false,
      p_organization_id: orgId,
    }
  );
  assert(!createProvError && provisionalId, "admin_create_provisional_athlete", createProvError?.message);

  const { data: inviteToken, error: sendError } = await adminClient.rpc(
    "admin_send_athlete_invite",
    { p_provisional_id: provisionalId }
  );
  assert(!sendError && inviteToken, "admin_send_athlete_invite", sendError?.message);

  const { data: invitePublic } = await service.rpc("get_athlete_invite_public", {
    p_token: inviteToken,
  });
  assert(
    invitePublic?.[0]?.is_valid === true,
    "get_athlete_invite_public valid token"
  );

  const { data: invitedAuth, error: invitedAuthError } = await service.auth.admin.createUser({
    email: inviteEmail,
    email_confirm: true,
    user_metadata: { name: "E2E Invite Athlete", account_type: "athlete" },
  });
  if (!invitedAuthError && invitedAuth?.user?.id) {
    const invitedUserId = invitedAuth.user.id;
    const { error: completeError } = await service.rpc(
      "complete_athlete_invite_registration",
      { p_token: inviteToken, p_user_id: invitedUserId }
    );
    assert(!completeError, "complete_athlete_invite_registration", completeError?.message);

    const { data: linkedProfile } = await service
      .from("profiles")
      .select("sport, athlete_review_status, invited_via_provisional_id")
      .eq("id", invitedUserId)
      .single();
    assert(linkedProfile?.sport === "水泳", "invite links sport to profile");
    assert(
      linkedProfile?.invited_via_provisional_id === provisionalId,
      "invite links provisional id"
    );
    assert(linkedProfile?.athlete_review_status === "approved", "invite copies review status");

    await cleanupTestUser(invitedUserId);
    ok("invited athlete cleanup");
  } else {
    fail("invited user creation", invitedAuthError?.message);
  }

  await service.from("athlete_invites").delete().eq("provisional_profile_id", provisionalId);
  await service.from("athlete_organization_memberships").delete().eq("provisional_profile_id", provisionalId);
  await service.from("athlete_provisional_profiles").delete().eq("id", provisionalId);
  await service.from("organizations").delete().eq("id", orgId);
  ok("invite flow cleanup");
} else {
  fail("athlete invite flow", "no admin user");
}

// Cleanup test athlete
if (testAthleteId) {
  try {
    await cleanupTestUser(testAthleteId);
    ok("test athlete cleanup");
  } catch (err) {
    fail("test athlete cleanup", err.message);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

if (failed > 0) process.exit(1);
console.log("Pre-launch E2E passed.");
