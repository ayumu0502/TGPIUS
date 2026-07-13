"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--content-bg)] px-6 text-center">
      <div className="premium-card max-w-md p-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--gold-dark)]">
          Error
        </p>
        <h1 className="ja-heading mt-3 text-2xl font-bold text-[var(--text-primary)]">
          問題が発生しました
        </h1>
        <p className="ja-body mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
          一時的なエラーの可能性があります。しばらくしてから再度お試しください。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn-gold rounded-full px-6 py-3 text-sm">
            再試行
          </button>
          <Link href="/" className="btn-gold-outline rounded-full px-6 py-3 text-sm">
            トップへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
