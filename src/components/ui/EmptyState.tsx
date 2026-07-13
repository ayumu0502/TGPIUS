import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionHref,
  actionLabel,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`premium-card px-6 py-16 text-center sm:px-10 sm:py-20 ${className}`}>
      {icon ? (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(197,160,89,0.2)] bg-[rgba(197,160,89,0.08)] text-[var(--gold-dark)]">
          {icon}
        </div>
      ) : (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(197,160,89,0.2)] bg-[rgba(197,160,89,0.08)] text-xl text-[var(--gold-dark)]">
          ✦
        </div>
      )}
      <h2 className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">{title}</h2>
      {description ? (
        <p className="ja-body mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-8">{action}</div>
      ) : actionHref && actionLabel ? (
        <Link href={actionHref} className="btn-gold mt-8 inline-block rounded-full px-6 py-3 text-sm">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
