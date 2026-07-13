import { formatYen } from "@/lib/points/constants";
import type { BillingRecord } from "@/types/subscription";

type SupporterBillingHistoryProps = {
  records: BillingRecord[];
};

function formatBillingDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: BillingRecord["status"]): string {
  switch (status) {
    case "paid":
      return "支払済";
    case "failed":
      return "失敗";
    case "refunded":
      return "返金済";
    default:
      return "処理中";
  }
}

export default function SupporterBillingHistory({ records }: SupporterBillingHistoryProps) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">請求履歴はまだありません。</p>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-[var(--text-primary)]">請求履歴</h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        法的表示のため金額は円表記です
      </p>
      <ul className="mt-4 divide-y divide-[var(--card-border)]">
        {records.map((record) => (
          <li key={record.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{record.description}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {formatBillingDate(record.created_at)} · {statusLabel(record.status)}
              </p>
            </div>
            <p className="font-semibold text-[var(--text-primary)]">
              {formatYen(record.amount_yen)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
