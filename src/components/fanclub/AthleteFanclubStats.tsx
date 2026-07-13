import { ProfileAvatar } from "@/components/social/SocialLayout";
import { formatYen, MEMBERSHIP_STATUS_LABELS } from "@/lib/fanclub/constants";
import type { FanclubManageData } from "@/types/fanclub";

export function FanclubStatsCards({ stats }: { stats: FanclubManageData["stats"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "会員数", value: `${stats.active_members}人`, sub: "有効会員" },
        { label: "月間収益", value: formatYen(stats.monthly_revenue), sub: "今月のテスト決済" },
        { label: "解約率", value: `${stats.churn_rate}%`, sub: "累計ベース" },
        { label: "プラン数", value: `${stats.member_growth.length}ヶ月`, sub: "推移データ" },
      ].map((item) => (
        <div key={item.label} className="premium-card p-5">
          <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--gold-dark)]">{item.value}</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

export function FanclubMemberGrowthChart({
  data,
}: {
  data: FanclubManageData["stats"]["member_growth"];
}) {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="premium-card p-5">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">会員数推移</h3>
      <div className="mt-5 flex items-end gap-3">
        {data.map((item) => (
          <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-[var(--gold)] to-[var(--gold)]/40"
              style={{ height: `${Math.max((item.count / max) * 120, 8)}px` }}
            />
            <span className="text-[10px] text-[var(--text-muted)]">{item.month.slice(5)}月</span>
            <span className="text-xs font-medium">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FanclubMembersList({
  members,
}: {
  members: FanclubManageData["members"];
}) {
  return (
    <div className="premium-card p-5">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">会員一覧</h3>
      {members.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">まだ会員がいません</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {members.slice(0, 20).map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] p-3"
            >
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  name={member.fan_name}
                  avatarUrl={member.fan_avatar_url}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium">{member.fan_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatYen(member.price_yen)}/月
                  </p>
                </div>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                {MEMBERSHIP_STATUS_LABELS[member.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
