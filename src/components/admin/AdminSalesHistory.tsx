import { formatAdminDate, formatYen } from "@/lib/admin/constants";
import { formatPoints } from "@/lib/points/constants";
import type { AdminPayment } from "@/types/admin";

type AdminSalesHistoryProps = {
  sales: AdminPayment[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: "処理中",
  completed: "完了",
  failed: "失敗",
  refunded: "返金済み",
  cancelled: "キャンセル",
};

export default function AdminSalesHistory({ sales }: AdminSalesHistoryProps) {
  if (sales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-border)] px-4 py-12 text-center">
        <p className="text-[var(--text-muted)]">売上データがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => (
        <div
          key={sale.id}
          className="premium-card flex flex-wrap items-start justify-between gap-3 p-4"
        >
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)]">{sale.user_name}</p>
            <p className="truncate text-sm text-[var(--text-muted)]">{sale.user_email}</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {formatAdminDate(sale.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {formatYen(sale.amount_total)}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              +{formatPoints(sale.point_amount)} · 手数料{" "}
              {formatYen(sale.platform_fee)} · 純売上{" "}
              {formatYen(sale.net_amount)}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {STATUS_LABELS[sale.status] ?? sale.status}
              {sale.payment_method === "test" ? " · テスト" : " · Stripe"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
