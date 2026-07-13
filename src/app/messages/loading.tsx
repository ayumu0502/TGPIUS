import AppSkeleton from "@/components/ui/AppSkeleton";

export default function MessagesLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      <div className="hidden w-96 shrink-0 border-r border-[var(--card-border)] bg-white p-4 lg:block">
        <AppSkeleton variant="cards" />
      </div>
      <div className="flex flex-1 items-center justify-center bg-[var(--content-bg)] p-8">
        <div className="premium-card w-full max-w-sm p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
          <p className="mt-4 text-sm text-[var(--text-muted)]">メッセージを読み込み中...</p>
        </div>
      </div>
    </div>
  );
}
