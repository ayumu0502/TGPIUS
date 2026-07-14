export const CONTACT_INQUIRY_TYPES = [
  { value: "sponsor", label: "スポンサー契約" },
  { value: "tieup", label: "タイアップ企画" },
  { value: "advertising", label: "広告掲載" },
  { value: "event", label: "イベント協賛" },
  { value: "corporate", label: "福利厚生・法人利用" },
  { value: "media", label: "メディア取材" },
  { value: "other", label: "その他" },
] as const;

export type ContactInquiryType = (typeof CONTACT_INQUIRY_TYPES)[number]["value"];

export const CONTACT_SUCCESS_MESSAGE =
  "お問い合わせありがとうございます。通常2営業日以内に担当者よりご返信いたします。";

export function getInquiryTypeLabel(value: string): string {
  return (
    CONTACT_INQUIRY_TYPES.find((item) => item.value === value)?.label ?? value
  );
}
