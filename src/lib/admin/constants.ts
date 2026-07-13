import type { AdminActionState, AdminPointPurchase, AdminStats, AdminUser } from "@/types/admin";

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function formatAdminDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ACCOUNT_TYPE_LABELS: Record<AdminUser["account_type"], string> = {
  fan: "ファン",
  athlete: "アスリート",
  sponsor: "スポンサー",
};

export type { AdminStats, AdminUser, AdminPointPurchase, AdminActionState };
