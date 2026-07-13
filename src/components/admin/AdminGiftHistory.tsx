import { formatAdminDate } from "@/lib/admin/constants";
import { formatPoints } from "@/lib/points/constants";
import type { AdminGift } from "@/types/admin";

type AdminGiftHistoryProps = {
  gifts: AdminGift[];
};

export default function AdminGiftHistory({ gifts }: AdminGiftHistoryProps) {
  if (gifts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-border)] px-4 py-12 text-center">
        <p className="text-[var(--text-muted)]">ギフト履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gifts.map((gift) => (
        <div
          key={gift.id}
          className="premium-card flex flex-wrap items-start justify-between gap-3 p-4"
        >
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)]">
              {gift.sender_name}
              <span className="mx-2 text-[var(--text-muted)]">→</span>
              {gift.receiver_name}
            </p>
            {gift.message ? (
              <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
                {gift.message}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {formatAdminDate(gift.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {formatPoints(gift.amount)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
