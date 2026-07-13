import type {
  FanclubBenefitType,
  FanclubPlanPrice,
  FanclubPostType,
} from "@/types/fanclub";

export const FANCLUB_PRICES: FanclubPlanPrice[] = [500, 1000, 3000, 5000];

export const BENEFIT_OPTIONS: {
  value: FanclubBenefitType;
  label: string;
  description: string;
}[] = [
  { value: "exclusive_post", label: "限定投稿", description: "会員限定の投稿コンテンツ" },
  { value: "exclusive_video", label: "限定動画", description: "会員限定の動画コンテンツ" },
  { value: "exclusive_live", label: "限定ライブ", description: "会員限定ライブ配信" },
  { value: "exclusive_event", label: "限定イベント", description: "会員限定イベント参加" },
  { value: "exclusive_chat", label: "限定チャット", description: "会員限定チャットルーム" },
];

export const POST_TYPE_OPTIONS: { value: FanclubPostType; label: string }[] = [
  { value: "post", label: "限定投稿" },
  { value: "video", label: "限定動画" },
  { value: "live", label: "限定ライブ" },
  { value: "event", label: "限定イベント" },
  { value: "chat", label: "限定チャット" },
];

export const BENEFIT_LABELS: Record<FanclubBenefitType, string> = {
  exclusive_post: "限定投稿",
  exclusive_video: "限定動画",
  exclusive_live: "限定ライブ",
  exclusive_event: "限定イベント",
  exclusive_chat: "限定チャット",
};

export const POST_TYPE_LABELS: Record<FanclubPostType, string> = {
  post: "限定投稿",
  video: "限定動画",
  live: "限定ライブ",
  event: "限定イベント",
  chat: "限定チャット",
};

export const MEMBERSHIP_STATUS_LABELS = {
  active: "有効",
  cancelled: "解約済み",
  expired: "期限切れ",
} as const;

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function formatMembershipPeriod(start: string, end: string): string {
  const startDate = new Date(start).toLocaleDateString("ja-JP");
  const endDate = new Date(end).toLocaleDateString("ja-JP");
  return `${startDate} 〜 ${endDate}`;
}

export function getTestPaymentNote(priceYen: number): string {
  return `テスト決済: ポイント ${priceYen.toLocaleString("ja-JP")} pt を消費します`;
}
