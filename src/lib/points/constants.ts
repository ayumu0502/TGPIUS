import { PURCHASE_AMOUNTS, type PurchaseAmount } from "@/types/points";
import { POINT_PLANS } from "@/lib/stripe/plans";

/** User-facing point label: 1,000ポイント */
export function formatPoints(value: number): string {
  return `${value.toLocaleString("ja-JP")}ポイント`;
}

/** Legal / Stripe checkout / receipts only */
export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function formatPurchaseDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPurchaseLabel(amount: PurchaseAmount): string {
  return POINT_PLANS[amount].label;
}

export { PURCHASE_AMOUNTS };
