import Link from "next/link";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "TGPLUS — アスリート・ファン・企業をつなぐスポーツ応援プラットフォーム",
  description:
    "TGPLUSは、アスリート・ファン・企業スポンサーをつなぐスポーツ応援プラットフォームです。ギフト、メッセージ、イベントを通じて、選手の挑戦を支援できます。",
  path: "/",
});

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--content-bg)] px-6 text-center">
      <div className="premium-card max-w-md p-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--gold-dark)]">
          404
        </p>
        <h1 className="ja-heading mt-3 text-2xl font-bold text-[var(--text-primary)]">
          ページが見つかりません
        </h1>
        <p className="ja-body mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
          お探しのページは移動または削除された可能性があります。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-gold rounded-full px-6 py-3 text-sm">
            トップへ戻る
          </Link>
          <Link
            href="/login"
            className="btn-gold-outline rounded-full px-6 py-3 text-sm"
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
