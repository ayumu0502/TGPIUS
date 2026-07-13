import type { PurchaseAmount } from "@/types/points";
import { getSupporterPriceId as getSupporterPriceIdFromEnv } from "@/lib/stripe/env";

export const PLATFORM_FEE_RATE = Number(
  process.env.STRIPE_PLATFORM_FEE_RATE ?? "0.1"
);

export type PointPlan = {
  points: PurchaseAmount;
  yen: number;
  label: string;
};

export const POINT_PLANS: Record<PurchaseAmount, PointPlan> = {
  1000: { points: 1000, yen: 1000, label: "スターター" },
  3000: { points: 3000, yen: 3000, label: "ライト" },
  5000: { points: 5000, yen: 5000, label: "スタンダード" },
  10000: { points: 10000, yen: 10000, label: "プレミアム" },
  30000: { points: 30000, yen: 30000, label: "スペシャル" },
  50000: { points: 50000, yen: 50000, label: "エリート" },
  100000: { points: 100000, yen: 100000, label: "チャンピオン" },
};

export const SUPPORTER_PLAN = {
  name: "TGPLUSサポーター",
  priceYen: 1000,
  priceLabel: "月額1,000円（税込）",
  benefits: [
    "限定投稿の閲覧",
    "限定動画の視聴",
    "限定イベントへの参加",
    "限定メッセージ",
    "限定ライブ（今後）",
    "サポーターバッジ",
  ],
} as const;

export function calculatePlatformFee(yen: number): number {
  return Math.floor(yen * PLATFORM_FEE_RATE);
}

export function calculateNetAmount(yen: number): number {
  return yen - calculatePlatformFee(yen);
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!url) return "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getStripeWebhookUrl(): string {
  return `${getAppUrl()}/api/stripe/webhook`;
}

export function getSupporterPriceId(): string | null {
  return getSupporterPriceIdFromEnv();
}
