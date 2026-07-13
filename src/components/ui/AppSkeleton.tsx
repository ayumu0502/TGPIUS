type AppSkeletonProps = {
  variant?: "page" | "cards" | "feed" | "stats";
};

function Block({ className = "" }: { className?: string }) {
  return <div className={`skeleton-block rounded-xl ${className}`} />;
}

export default function AppSkeleton({ variant = "page" }: AppSkeletonProps) {
  if (variant === "stats") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="premium-card p-5">
            <Block className="h-3 w-20" />
            <Block className="mt-3 h-8 w-28" />
            <Block className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "feed") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="premium-card p-5">
            <div className="flex items-center gap-3">
              <Block className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Block className="h-4 w-32" />
                <Block className="h-3 w-20" />
              </div>
            </div>
            <Block className="mt-4 h-40 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="premium-card p-5">
            <Block className="h-5 w-3/4" />
            <Block className="mt-3 h-4 w-full" />
            <Block className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="premium-card p-8">
        <Block className="h-4 w-28" />
        <Block className="mt-4 h-10 w-2/3 max-w-md" />
        <Block className="mt-3 h-4 w-full max-w-lg" />
      </div>
      <AppSkeleton variant="stats" />
      <AppSkeleton variant="cards" />
    </div>
  );
}
