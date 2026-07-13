import Link from "next/link";
import { IconMessage } from "@/components/layout/premium/PremiumIcons";

export default function PremiumMessagesEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="rounded-2xl border border-[var(--card-border)] bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold)]/10">
          <IconMessage className="h-7 w-7 text-[var(--gold-dark)]" />
        </div>
        <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
          メッセージを選択
        </p>
        <p className="ja-body mt-2 max-w-sm text-sm text-[var(--text-muted)]">
          左の一覧から会話を選ぶか、新しいメッセージを始めてください
        </p>
        <Link
          href="/fan/gifts"
          className="btn-gold mt-6 inline-block rounded-full px-6 py-2.5 text-sm"
        >
          選手を探す
        </Link>
      </div>
    </div>
  );
}
