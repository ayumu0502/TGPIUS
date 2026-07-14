import { CONTACT_INQUIRY_TYPES, type ContactInquiryType } from "@/lib/contact/constants";

export type ContactFormState = {
  success?: string;
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "companyName"
      | "contactName"
      | "email"
      | "phone"
      | "inquiryType"
      | "message"
      | "privacyConsent",
      string
    >
  >;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseContactForm(formData: FormData) {
  return {
    companyName: String(formData.get("companyName") ?? "").trim(),
    contactName: String(formData.get("contactName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    inquiryType: String(formData.get("inquiryType") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
    privacyConsent: formData.get("privacyConsent") === "on",
    honeypot: String(formData.get("companyWebsite") ?? "").trim(),
  };
}

export function validateContactForm(input: ReturnType<typeof parseContactForm>): ContactFormState | null {
  const fieldErrors: NonNullable<ContactFormState["fieldErrors"]> = {};

  if (!input.companyName) {
    fieldErrors.companyName = "会社名を入力してください";
  } else if (input.companyName.length > 120) {
    fieldErrors.companyName = "会社名は120文字以内で入力してください";
  }

  if (!input.contactName) {
    fieldErrors.contactName = "ご担当者様名を入力してください";
  } else if (input.contactName.length > 80) {
    fieldErrors.contactName = "氏名は80文字以内で入力してください";
  }

  if (!input.email) {
    fieldErrors.email = "メールアドレスを入力してください";
  } else if (!EMAIL_PATTERN.test(input.email)) {
    fieldErrors.email = "有効なメールアドレスを入力してください";
  }

  if (input.phone && input.phone.length > 30) {
    fieldErrors.phone = "電話番号は30文字以内で入力してください";
  }

  const validTypes = CONTACT_INQUIRY_TYPES.map((item) => item.value);
  if (!input.inquiryType) {
    fieldErrors.inquiryType = "お問い合わせ種別を選択してください";
  } else if (!validTypes.includes(input.inquiryType as ContactInquiryType)) {
    fieldErrors.inquiryType = "お問い合わせ種別を選択してください";
  }

  if (!input.message) {
    fieldErrors.message = "お問い合わせ内容を入力してください";
  } else if (input.message.length < 10) {
    fieldErrors.message = "お問い合わせ内容は10文字以上で入力してください";
  } else if (input.message.length > 5000) {
    fieldErrors.message = "お問い合わせ内容は5000文字以内で入力してください";
  }

  if (!input.privacyConsent) {
    fieldErrors.privacyConsent = "プライバシーポリシーへの同意が必要です";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}
