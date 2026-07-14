import { createServiceClient } from "@/lib/supabase/admin";
import { getInquiryTypeLabel } from "@/lib/contact/constants";

export type ContactMailPayload = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
};

export async function resolveAdminEmail(): Promise<string | null> {
  const configured = process.env.CONTACT_ADMIN_EMAIL?.trim();
  if (configured) return configured;

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .eq("is_admin", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return data?.email?.trim() ?? null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendContactInquiryEmail(
  payload: ContactMailPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "メール送信の設定が完了していません（RESEND_API_KEY）" };
  }

  const adminEmail = await resolveAdminEmail();
  if (!adminEmail) {
    return {
      ok: false,
      error: "管理者メールアドレスが設定されていません（CONTACT_ADMIN_EMAIL）",
    };
  }

  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() ?? "TGPLUS <onboarding@resend.dev>";
  const inquiryLabel = getInquiryTypeLabel(payload.inquiryType);
  const subject = `[TGPLUS] ${inquiryLabel} — ${payload.companyName}`;

  const text = [
    "TGPLUS 企業お問い合わせ",
    "",
    `会社名: ${payload.companyName}`,
    `ご担当者様名: ${payload.contactName}`,
    `メールアドレス: ${payload.email}`,
    `電話番号: ${payload.phone || "（未入力）"}`,
    `お問い合わせ種別: ${inquiryLabel}`,
    "",
    "お問い合わせ内容:",
    payload.message,
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.7;">
      <h2 style="color: #9e7d3c; font-size: 18px; margin-bottom: 16px;">TGPLUS 企業お問い合わせ</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">会社名</td><td>${escapeHtml(payload.companyName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">ご担当者様名</td><td>${escapeHtml(payload.contactName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">メール</td><td>${escapeHtml(payload.email)}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">電話番号</td><td>${escapeHtml(payload.phone || "（未入力）")}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">種別</td><td>${escapeHtml(inquiryLabel)}</td></tr>
      </table>
      <p style="margin-top: 20px; color: #6b7280; font-size: 13px;">お問い合わせ内容</p>
      <div style="white-space: pre-wrap; background: #f7f8fa; border: 1px solid #e8eaed; border-radius: 12px; padding: 16px;">${escapeHtml(payload.message)}</div>
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
      to: [adminEmail],
      reply_to: payload.email,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: "メールの送信に失敗しました。時間をおいて再度お試しください。" };
  }

  return { ok: true };
}
