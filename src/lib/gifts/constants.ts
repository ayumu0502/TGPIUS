import { GIFT_AMOUNTS, type GiftAmount } from "@/types/gifts";

export function formatPoints(value: number): string {
  return `${value.toLocaleString("ja-JP")}ポイント`;
}

export function formatGiftDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getGiftLabel(amount: GiftAmount): string {
  const labels: Record<GiftAmount, string> = {
    100: "ライト応援",
    300: "カジュアル",
    500: "スタンダード",
    1000: "プレミアム",
    3000: "スペシャル",
    10000: "チャンピオン",
  };
  return labels[amount];
}

export { GIFT_AMOUNTS };
