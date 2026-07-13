import { formatAdminDate, formatYen } from "@/lib/admin/constants";
import { formatPoints } from "@/lib/points/constants";
import type { AdminPointPurchase } from "@/types/admin";

type AdminPurchaseHistoryProps = {
  purchases: AdminPointPurchase[];
};

export default function AdminPurchaseHistory({
  purchases,
}: AdminPurchaseHistoryProps) {
  if (purchases.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-border)] px-4 py-12 text-center">
        <p className="text-[var(--text-muted)]">購入履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="premium-card flex flex-wrap items-start justify-between gap-3 p-4"
        >
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)]">{purchase.user_name}</p>
            <p className="truncate text-sm text-[var(--text-muted)]">
              {purchase.user_email}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {formatAdminDate(purchase.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--text-primary)]">
              +{formatPoints(purchase.amount)}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {formatYen(purchase.amount)}
              {purchase.payment_method === "test" ? " · テスト" : " · Stripe"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
