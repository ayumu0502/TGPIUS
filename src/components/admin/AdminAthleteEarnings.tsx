import { formatPoints } from "@/lib/points/constants";
import type { AdminAthleteEarning } from "@/types/admin";

type AdminAthleteEarningsProps = {
  earnings: AdminAthleteEarning[];
};

export default function AdminAthleteEarnings({ earnings }: AdminAthleteEarningsProps) {
  if (earnings.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">アスリート売上データはありません。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--card-border)] text-xs text-[var(--text-muted)]">
            <th className="py-2 pr-4">アスリート</th>
            <th className="py-2 pr-4">ギフト件数</th>
            <th className="py-2 pr-4">ギフト売上（手取り）</th>
            <th className="py-2">総売上</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((row) => (
            <tr key={row.athlete_id} className="border-b border-[var(--card-border)]/60">
              <td className="py-3 pr-4 font-medium">{row.athlete_name}</td>
              <td className="py-3 pr-4">{row.gift_count.toLocaleString("ja-JP")}件</td>
              <td className="py-3 pr-4">{formatPoints(row.gift_net)}</td>
              <td className="py-3">{formatPoints(row.total_earnings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
