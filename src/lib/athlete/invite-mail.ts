import { getAppUrl } from "@/lib/stripe/plans";

type InviteEmailPayload = {
  athleteName: string;
  sport: string;
  inviteUrl: string;
  expiresAt: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildAthleteInviteUrl(token: string): string {
  const base = getAppUrl().replace(/\/$/, "");
  return `${base}/register/invite?token=${encodeURIComponent(token)}`;
}

export async function sendAthleteInviteEmail(
  email: string,
  payload: InviteEmailPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "メール送信の設定が完了していません（RESEND_API_KEY）" };
  }

  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() ?? "TGPLUS <onboarding@resend.dev>";
  const subject = `[TGPLUS] アスリート登録のご招待 — ${payload.athleteName}`;

  const text = [
    `${payload.athleteName} 様`,
    "",
    "TGPLUSのアスリートアカウント登録にご招待いたします。",
    "",
    `競技: ${payload.sport}`,
    `登録URL: ${payload.inviteUrl}`,
    `有効期限: ${payload.expiresAt}`,
    "",
    "上記URLからパスワードを設定し、登録を完了してください。",
    "登録後、管理者が作成したプロフィール情報が自動で紐づきます。",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.7;">
      <h2 style="color: #9e7d3c; font-size: 18px;">TGPLUS アスリート登録のご招待</h2>
      <p>${escapeHtml(payload.athleteName)} 様</p>
      <p>TGPLUSのアスリートアカウント登録にご招待いたします。</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">競技</td><td>${escapeHtml(payload.sport)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">有効期限</td><td>${escapeHtml(payload.expiresAt)}</td></tr>
      </table>
      <p><a href="${escapeHtml(payload.inviteUrl)}" style="display:inline-block;background:linear-gradient(135deg,#dbb978,#c5a059);color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">登録を完了する</a></p>
      <p style="font-size: 12px; color: #6b7280;">リンクが開けない場合: ${escapeHtml(payload.inviteUrl)}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: "招待メールの送信に失敗しました" };
  }

  return { ok: true };
}
