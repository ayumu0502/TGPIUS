import { formatYen } from "@/lib/fanclub/constants";
import type { FanclubAdminAnalytics } from "@/types/fanclub";

export default function AdminFanclubAnalytics({
  analytics,
}: {
  analytics: FanclubAdminAnalytics;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">ファンクラブ分析</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">サブスク売上・加入率・解約率</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "総加入", value: analytics.total_subscriptions.toLocaleString("ja-JP") },
          { label: "有効加入", value: analytics.active_subscriptions.toLocaleString("ja-JP") },
          { label: "総売上", value: formatYen(analytics.total_revenue) },
          { label: "月間売上", value: formatYen(analytics.monthly_revenue) },
          { label: "加入率", value: `${analytics.join_rate}%` },
          { label: "解約率", value: `${analytics.churn_rate}%` },
        ].map((item) => (
          <div key={item.label} className="premium-card p-4">
            <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="premium-card p-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">アスリート別ランキング</h3>
        {analytics.top_athletes.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">データがありません</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {analytics.top_athletes.map((item) => (
              <li
                key={item.athlete_name}
                className="flex items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm text-[var(--text-primary)]">{item.athlete_name}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  会員 {item.member_count}人 · {formatYen(item.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
