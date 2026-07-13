export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--content-bg)]">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-white shadow-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
        </div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">読み込み中...</p>
      </div>
    </div>
  );
}
