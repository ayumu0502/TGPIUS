import Link from "next/link";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { getRankMedalStyle } from "@/lib/rankings/constants";
import type { RankingPreviewAthlete } from "@/types/rankings";

type RankingPreviewWidgetProps = {
  athletes: RankingPreviewAthlete[];
  title?: string;
  description?: string;
  href?: string;
  compact?: boolean;
};

export default function RankingPreviewWidget({
  athletes,
  title = "応援ランキング",
  description = "月間ギフト支援額トップ",
  href = "/rankings?category=gifts_month",
  compact = false,
}: RankingPreviewWidgetProps) {
  return (
    <div className={`premium-card ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 text-xs text-[var(--gold-dark)] hover:underline"
        >
          すべて ›
        </Link>
      </div>

      <ol className="mt-4 space-y-3">
        {athletes.length === 0 ? (
          <li className="py-4 text-center text-xs text-[var(--text-muted)]">
            データ準備中
          </li>
        ) : (
          athletes.map((athlete) => (
            <li key={athlete.id}>
              <Link
                href={`/profile/${athlete.id}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-50"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getRankMedalStyle(athlete.rank)}`}
                >
                  {athlete.rank}
                </span>
                <ProfileAvatar
                  name={athlete.name}
                  avatarUrl={athlete.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{athlete.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {athlete.sport || "競技未設定"}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--gold-dark)]">
                  {athlete.score.toLocaleString("ja-JP")} pt
                </span>
              </Link>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
