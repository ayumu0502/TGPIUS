import { formatYen } from "@/lib/points/constants";
import type { AdminBillingRecord } from "@/types/admin";

type AdminFailedPaymentsProps = {
  records: AdminBillingRecord[];
};

export default function AdminFailedPayments({ records }: AdminFailedPaymentsProps) {
  if (records.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">決済失敗の記録はありません。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--card-border)] text-xs text-[var(--text-muted)]">
            <th className="py-2 pr-4">日時</th>
            <th className="py-2 pr-4">ユーザー</th>
            <th className="py-2 pr-4">種別</th>
            <th className="py-2 pr-4">金額</th>
            <th className="py-2">内容</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-[var(--card-border)]/60">
              <td className="py-3 pr-4 text-[var(--text-muted)]">
                {new Date(record.created_at).toLocaleDateString("ja-JP")}
              </td>
              <td className="py-3 pr-4">{record.user_name}</td>
              <td className="py-3 pr-4">{record.record_type}</td>
              <td className="py-3 pr-4">{formatYen(record.amount_yen)}</td>
              <td className="py-3 text-[var(--text-secondary)]">{record.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
