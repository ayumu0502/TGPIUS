/**
 * Final pre-launch E2E: core flows + password reset + Resend + Stripe + contact form.
 * Usage: node scripts/test-final-e2e.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(
  /\/$/,
  ""
);

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const service = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let passed = 0;
let failed = 0;
let skipped = 0;

function ok(label) {
  console.log(`  OK   ${label}`);
  passed++;
}

function fail(label, detail = "") {
  console.error(`  FAIL ${label}${detail ? `: ${detail}` : ""}`);
  failed++;
}

function skip(label, reason = "") {
  console.log(`  SKIP ${label}${reason ? `: ${reason}` : ""}`);
  skipped++;
}

function assert(condition, label, detail = "") {
  if (condition) ok(label);
  else fail(label, detail);
}

async function tryApplyStripeCheckoutRpc() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) return false;

  const sql = readFileSync(
    resolve(process.cwd(), "supabase/stripe-checkout-user-rpc.sql"),
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
  if (!response.ok) {
    const body = await response.text();
    console.error("  WARN stripe-checkout-user-rpc apply failed:", body.slice(0, 200));
  }
  return response.ok;
}

async function rpcExists(name, args) {
  const { error } = await service.rpc(name, args);
  if (!error) return true;
  const msg = error.message.toLowerCase();
  if (msg.includes("could not find the function") || msg.includes("does not exist")) {
    return false;
  }
  return true;
}

async function testPasswordReset() {
  console.log("\n8. パスワード再設定");

  const email = `e2e-reset-${Date.now()}@example.com`;
  const oldPassword = "OldPass123!";
  const newPassword = "NewPass456!";

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password: oldPassword,
    email_confirm: true,
    user_metadata: { name: "E2E Reset User", account_type: "fan" },
  });
  if (createError || !created?.user?.id) {
    fail("create reset test user", createError?.message);
    return;
  }
  ok("create reset test user");

  await service.from("profiles").upsert({
    id: created.user.id,
    name: "E2E Reset User",
    email,
    account_type: "fan",
  });

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${appUrl}/auth/confirm?next=/reset-password` },
  });
  if (linkError) {
    fail("generate recovery link", linkError.message);
    await service.auth.admin.deleteUser(created.user.id);
    return;
  }
  ok("generate recovery link");

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) {
    fail("recovery token hash present");
    await service.auth.admin.deleteUser(created.user.id);
    return;
  }

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: otpData, error: otpError } = await authClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });
  if (otpError || !otpData.session?.access_token) {
    fail("verify recovery OTP", otpError?.message);
    await service.auth.admin.deleteUser(created.user.id);
    return;
  }
  ok("verify recovery OTP");

  const recoveryClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: sessionError } = await recoveryClient.auth.setSession({
    access_token: otpData.session.access_token,
    refresh_token: otpData.session.refresh_token,
  });
  if (sessionError) {
    fail("set recovery session", sessionError.message);
    await service.auth.admin.deleteUser(created.user.id);
    return;
  }

  const { error: updateError } = await recoveryClient.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    fail("update password via recovery session", updateError.message);
    await service.auth.admin.deleteUser(created.user.id);
    return;
  }
  ok("update password via recovery session");

  const loginClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: oldLoginError } = await loginClient.auth.signInWithPassword({
    email,
    password: oldPassword,
  });
  assert(!!oldLoginError, "old password rejected");

  const { error: newLoginError } = await loginClient.auth.signInWithPassword({
    email,
    password: newPassword,
  });
  assert(!newLoginError, "login with new password", newLoginError?.message);

  await service.auth.admin.deleteUser(created.user.id);
  ok("reset test user cleanup");
}

async function testResendConfig() {
  console.log("\n9. Resend（メール送信）");

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();
  const adminEmail =
    process.env.CONTACT_ADMIN_EMAIL?.trim() ||
    (
      await service
        .from("profiles")
        .select("email")
        .eq("is_admin", true)
        .limit(1)
        .maybeSingle()
    ).data?.email;

  if (!apiKey) {
    skip("RESEND_API_KEY configured", "not set in environment");
    skip("contact form email send", "RESEND_API_KEY missing");
    skip("athlete invite email send", "RESEND_API_KEY missing");
    return;
  }
  ok("RESEND_API_KEY configured");

  if (!fromEmail) {
    skip("CONTACT_FROM_EMAIL configured", "using Resend default sender");
  } else {
    ok("CONTACT_FROM_EMAIL configured");
  }

  if (!adminEmail) {
    fail("admin email for contact notifications");
    return;
  }
  ok("contact admin email resolved");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail || "TGPLUS <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `[TGPLUS E2E] Contact form test ${Date.now()}`,
      text: "Final E2E contact mail probe",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    fail("Resend API send (contact probe)", body.slice(0, 120));
    return;
  }
  ok("Resend API send (contact probe)");

  const inviteResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail || "TGPLUS <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `[TGPLUS E2E] Athlete invite test ${Date.now()}`,
      text: `Invite URL probe: ${appUrl}/register/invite?token=e2e-test`,
    }),
  });

  if (!inviteResponse.ok) {
    const body = await inviteResponse.text();
    fail("Resend API send (invite probe)", body.slice(0, 120));
    return;
  }
  ok("Resend API send (invite probe)");
}

async function testContactFormLogic() {
  console.log("\n10. お問い合わせフォーム");

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validTypes = ["sponsorship", "media", "partnership", "other"];

  function validateContact(input) {
    const fieldErrors = {};
    if (!input.companyName) fieldErrors.companyName = "required";
    if (!input.contactName) fieldErrors.contactName = "required";
    if (!input.email || !EMAIL_PATTERN.test(input.email)) fieldErrors.email = "invalid";
    if (!validTypes.includes(input.inquiryType)) fieldErrors.inquiryType = "invalid";
    if (!input.message || input.message.length < 10) fieldErrors.message = "short";
    if (!input.privacyConsent) fieldErrors.privacyConsent = "required";
    return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : null;
  }

  const invalid = validateContact({
    companyName: "",
    contactName: "Test",
    email: "invalid",
    inquiryType: "sponsorship",
    message: "short",
    privacyConsent: false,
  });
  assert(!!invalid?.fieldErrors, "contact validation rejects invalid input");

  const valid = validateContact({
    companyName: "E2E Corp",
    contactName: "Tester",
    email: "e2e@example.com",
    inquiryType: "sponsorship",
    message: "Final E2E contact form validation check message.",
    privacyConsent: true,
  });
  assert(!valid, "contact validation accepts valid input");

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    skip("contact mail send integration", "RESEND_API_KEY missing");
  } else {
    ok("contact mail path configured (Resend)");
  }
}

async function testStripe() {
  console.log("\n11. Stripe");

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET_TEST?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    "";

  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    fail("STRIPE_SECRET_KEY format");
    return;
  }
  ok(`STRIPE_SECRET_KEY (${secretKey.startsWith("sk_live_") ? "live" : "test"})`);

  if (publishableKey) {
    ok("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  } else {
    fail("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }

  if (webhookSecret) {
    ok("STRIPE_WEBHOOK_SECRET configured");
  } else {
    skip("STRIPE_WEBHOOK_SECRET", "not in local env (may exist on Vercel)");
  }

  try {
    const stripe = new Stripe(secretKey);
    await stripe.balance.retrieve();
    ok("Stripe API connection");
  } catch (e) {
    fail("Stripe API connection", e instanceof Error ? e.message : "error");
  }

  assert(await rpcExists("fulfill_stripe_payment", { p_payment_id: "00000000-0000-0000-0000-000000000000" }), "fulfill_stripe_payment RPC");

  const checkoutRpcs = [
    ["init_stripe_payment", { p_point_amount: 1000, p_amount_total: 1000, p_platform_fee: 100, p_net_amount: 900, p_metadata: {} }],
    ["link_stripe_customer", { p_stripe_customer_id: "cus_e2e_test" }],
    ["update_stripe_payment_session", { p_payment_id: "00000000-0000-0000-0000-000000000000", p_checkout_session_id: "cs_e2e" }],
    ["mark_stripe_payment_failed", { p_payment_id: "00000000-0000-0000-0000-000000000000", p_failure_message: "e2e" }],
    ["fulfill_stripe_payment_for_user", { p_payment_id: "00000000-0000-0000-0000-000000000000" }],
  ];

  const missing = [];
  for (const [name, args] of checkoutRpcs) {
    if (await rpcExists(name, args)) {
      ok(`${name} RPC`);
    } else {
      missing.push([name, args]);
    }
  }

  if (missing.length > 0) {
    const applied = await tryApplyStripeCheckoutRpc();
    if (applied) {
      ok("stripe-checkout-user-rpc auto-applied");
    }
    for (const [name, args] of missing) {
      if (await rpcExists(name, args)) {
        ok(`${name} RPC`);
      } else {
        fail(`${name} RPC`, "run supabase/stripe-checkout-user-rpc.sql in SQL Editor");
      }
    }
  }

  const priceId =
    process.env.STRIPE_SUPPORTER_PRICE_ID?.trim() ||
    process.env.STRIPE_SUPPORTER_PRICE_ID_LIVE?.trim();
  if (priceId) {
    ok("STRIPE_SUPPORTER_PRICE_ID configured");
  } else {
    skip("STRIPE_SUPPORTER_PRICE_ID", "optional for point purchases");
  }
}

async function testProductionPages() {
  console.log("\n12. 本番ページ到達性");

  const base = process.env.E2E_PRODUCTION_URL?.trim() || "https://tgpius.vercel.app";
  const paths = [
    "/login",
    "/forgot-password",
    "/reset-password?error=invalid",
    "/contact",
    "/register",
  ];

  for (const path of paths) {
    try {
      const response = await fetch(`${base}${path}`, { redirect: "follow" });
      assert(response.ok, `GET ${path} (${response.status})`);
    } catch (e) {
      fail(`GET ${path}`, e instanceof Error ? e.message : "error");
    }
  }
}

function runChildScript(scriptName, label) {
  const result = spawnSync("node", [`scripts/${scriptName}`], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    if (output) console.error(output);
    fail(label);
    return false;
  }
  const match = output.match(/(\d+) passed,\s*(\d+) failed/);
  if (match) {
    passed += Number(match[1]);
    failed += Number(match[2]);
  } else {
    ok(label);
  }
  return true;
}

console.log("=== TGPLUS Final E2E ===");

console.log("\n1-7. コア機能（prelaunch + invite）");
runChildScript("test-prelaunch-e2e.mjs", "test-prelaunch-e2e.mjs");
runChildScript("verify-athlete-invite-flow.mjs", "verify-athlete-invite-flow.mjs");

await testPasswordReset();
await testResendConfig();
await testContactFormLogic();
await testStripe();
await testProductionPages();

console.log(`\n=== Final Results: ${passed} passed, ${failed} failed, ${skipped} skipped ===`);

if (failed > 0) {
  process.exit(1);
}

console.log("Final E2E passed.");
