"use client";

import Link from "next/link";

export default function OfflineActions() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="btn-gold rounded-full px-6 py-2.5 text-sm"
      >
        再読み込み
      </button>
      <Link
        href="/"
        className="btn-gold-outline rounded-full px-6 py-2.5 text-sm"
      >
        トップへ
      </Link>
    </div>
  );
}
