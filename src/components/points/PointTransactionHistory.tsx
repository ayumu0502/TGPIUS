import { formatPoints, formatPurchaseDate, formatYen } from "@/lib/points/constants";
import type { PointTransaction } from "@/types/points";

type PointTransactionHistoryProps = {
  transactions: PointTransaction[];
};

function getPaymentMethodLabel(transaction: PointTransaction): string {
  if (transaction.payment_method === "test") {
    return "テスト購入";
  }
  if (transaction.payment_status === "refunded") {
    return "Stripe決済（返金済み）";
  }
  return "Stripe決済";
}

export default function PointTransactionHistory({
  transactions,
}: PointTransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--surface)] px-4 py-12 text-center">
        <p className="text-[var(--text-muted)]">まだ購入履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="premium-card flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5"
        >
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">ポイント購入</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {getPaymentMethodLabel(transaction)}
            </p>
            {transaction.amount_yen ? (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                支払額 {formatYen(transaction.amount_yen)}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {formatPurchaseDate(transaction.created_at)}
            </p>
          </div>
          <p className="text-lg font-bold text-[var(--gold-dark)]">
            +{formatPoints(transaction.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}
