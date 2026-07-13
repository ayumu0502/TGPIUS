import Link from "next/link";
import { formatGiftDate, formatPoints } from "@/lib/gifts/constants";
import type { GiftRecord } from "@/types/gifts";

type GiftHistoryListProps = {
  gifts: GiftRecord[];
  mode: "sent" | "received";
  emptyMessage: string;
  variant?: "dark" | "light";
};

export default function GiftHistoryList({
  gifts,
  mode,
  emptyMessage,
  variant = "light",
}: GiftHistoryListProps) {
  const isLight = variant === "light";

  if (gifts.length === 0) {
    return (
      <div
        className={`rounded-xl border border-dashed px-4 py-12 text-center ${
          isLight
            ? "border-[var(--card-border)] bg-zinc-50"
            : "border-white/10 bg-black/20"
        }`}
      >
        <p className={isLight ? "text-[var(--text-muted)]" : "text-zinc-500"}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gifts.map((gift) => (
        <div
          key={gift.id}
          className={`rounded-xl border p-4 sm:p-5 ${
            isLight
              ? "border-[var(--card-border)] bg-zinc-50"
              : "border-white/10 bg-black/40"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className={`text-sm font-medium ${
                  isLight ? "text-[var(--text-primary)]" : "text-white"
                }`}
              >
                {mode === "sent" ? (
                  <>
                    <Link
                      href={`/profile/${gift.receiver_id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {gift.receiver_name}
                    </Link>
                    さんへ
                  </>
                ) : (
                  <>{gift.sender_name}さんから</>
                )}
              </p>
              {mode === "sent" && gift.receiver_sport ? (
                <p
                  className={`mt-1 text-xs ${
                    isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
                  }`}
                >
                  {gift.receiver_sport}
                </p>
              ) : null}
              <p
                className={`mt-2 text-xs ${
                  isLight ? "text-[var(--text-muted)]" : "text-zinc-600"
                }`}
              >
                {formatGiftDate(gift.created_at)}
              </p>
            </div>
            <p
              className={`text-lg font-bold ${
                isLight ? "text-[var(--gold-dark)]" : "text-white"
              }`}
            >
              {mode === "sent" ? "-" : "+"}
              {formatPoints(gift.amount)}
            </p>
          </div>
          {gift.message ? (
            <p
              className={`ja-body mt-4 rounded-lg border px-3 py-2 text-sm ${
                isLight
                  ? "border-[var(--card-border)] bg-white text-[var(--text-secondary)]"
                  : "border-white/5 bg-white/5 text-zinc-300"
              }`}
            >
              「{gift.message}」
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
