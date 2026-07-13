import type { Metadata } from "next";
import OfflineActions from "@/components/pwa/OfflineActions";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "オフライン",
  description: "インターネット接続がありません",
  path: "/offline",
  noIndex: true,
});

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--content-bg)] px-6 text-center">
      <div className="premium-card max-w-md p-8 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] text-2xl font-bold text-white">
          T
        </div>
        <h1 className="ja-heading mt-6 text-2xl font-bold text-[var(--text-primary)]">
          オフラインです
        </h1>
        <p className="ja-body mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          インターネット接続を確認して、再度お試しください。
        </p>
        <OfflineActions />
      </div>
    </div>
  );
}
