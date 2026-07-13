export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="skeleton-block h-48 sm:h-64 lg:h-80" />
      <div className="border-b border-[var(--card-border)] bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl gap-4">
          <div className="skeleton-block h-24 w-24 shrink-0 rounded-full" />
          <div className="flex-1 space-y-3 pt-4">
            <div className="skeleton-block h-8 w-48 rounded-lg" />
            <div className="skeleton-block h-4 w-32 rounded" />
            <div className="skeleton-block h-4 w-full max-w-md rounded" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton-block h-10 w-20 rounded-full" />
          ))}
        </div>
        <div className="glass-card p-6">
          <div className="skeleton-block h-6 w-40 rounded" />
          <div className="mt-4 space-y-3">
            <div className="skeleton-block h-4 w-full rounded" />
            <div className="skeleton-block h-4 w-5/6 rounded" />
            <div className="skeleton-block h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold)]/10 text-2xl">
        ✦
      </div>
      <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
      {description ? (
        <p className="ja-body mt-2 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ProfileErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="glass-card border-red-200 bg-red-50/80 px-6 py-10 text-center">
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="btn-gold-outline mt-4 rounded-full px-5 py-2 text-sm"
        >
          再読み込み
        </button>
      ) : null}
    </div>
  );
}

export function ProfileStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-lg font-bold sm:text-xl ${
          highlight ? "text-[var(--gold-dark)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] text-[var(--text-muted)] sm:text-xs">{label}</p>
    </div>
  );
}
