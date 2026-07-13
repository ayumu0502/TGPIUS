import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
};

export function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div
      className={`premium-card premium-card-hover p-5 sm:p-6 ${
        highlight ? "border-[var(--gold)]/30 bg-[rgba(197,160,89,0.06)]" : ""
      }`}
    >
      <p className="text-xs font-medium text-[var(--text-muted)] sm:text-sm">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
        {value}
      </p>
      {sub ? (
        <p className="ja-body mt-1 text-xs text-[var(--text-muted)] sm:text-sm">{sub}</p>
      ) : null}
    </div>
  );
}

type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DashboardSection({
  title,
  description,
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section className="premium-card p-5 sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">{title}</h2>
          {description ? (
            <p className="ja-body mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={`btn-gold rounded-full px-5 py-2.5 text-sm ${className}`}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`rounded-full border border-[var(--card-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--gold)] hover:text-[var(--gold-dark)] ${className}`}
    >
      {children}
    </button>
  );
}

export function AthleteAvatar({ initial }: { initial: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(197,160,89,0.2)] bg-[rgba(197,160,89,0.1)] text-sm font-bold text-[var(--gold-dark)]">
      {initial}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "受付中" | "満席" | "終了" | "公開中" | "下書き" | "進行中" | "募集中" | "完了";
}) {
  const styles: Record<string, string> = {
    受付中: "badge-gold",
    満席: "border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-secondary)]",
    終了: "border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)]",
    公開中: "badge-gold",
    下書き: "border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)]",
    進行中: "badge-gold",
    募集中: "border border-[rgba(197,160,89,0.25)] bg-[rgba(197,160,89,0.08)] text-[var(--gold-dark)]",
    完了: "border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)]",
  };

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export function QuickActionCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <button type="button" className="premium-action-card">
      <div className="premium-action-icon">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="ja-body mt-1 text-xs text-[var(--text-muted)] sm:text-sm">{description}</p>
      </div>
    </button>
  );
}
