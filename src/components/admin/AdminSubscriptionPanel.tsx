import { formatPoints } from "@/lib/points/constants";

type AdminSubscriptionPanelProps = {
  activeCount: number;
  totalCount: number;
};

export default function AdminSubscriptionPanel({
  activeCount,
  totalCount,
}: AdminSubscriptionPanelProps) {
  return (
    <section className="premium-card p-6">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">TGPLUSサポーター</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Stripe Subscription · 月額1,000円（税込）</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">アクティブ会員</p>
          <p className="mt-1 text-2xl font-bold text-[var(--gold-dark)]">
            {activeCount.toLocaleString("ja-JP")}人
          </p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">登録総数</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {totalCount.toLocaleString("ja-JP")}件
          </p>
        </div>
      </div>
      <p className="ja-body mt-4 text-xs text-[var(--text-muted)]">
        月間想定売上（アクティブ×1,000円）: ¥{(activeCount * 1000).toLocaleString("ja-JP")}
      </p>
    </section>
  );
}
