import Link from "next/link";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import {
  formatRankingScore,
  getRankCardStyle,
  getRankMedalStyle,
} from "@/lib/rankings/constants";
import type { AthleteRankingEntry, RankingCategory } from "@/types/rankings";

type RankingCardProps = {
  entry: AthleteRankingEntry;
  category: RankingCategory;
  featured?: boolean;
};

export default function RankingCard({
  entry,
  category,
  featured = false,
}: RankingCardProps) {
  const scoreLabel = formatRankingScore(category, entry);
  const cardStyle = getRankCardStyle(entry.rank);

  return (
    <Link
      href={`/profile/${entry.id}`}
      className={`premium-card premium-card-hover flex items-center gap-3 p-4 transition-all ${
        cardStyle || ""
      } ${featured ? "sm:flex-col sm:items-center sm:p-5 sm:text-center" : ""}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
          featured ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs"
        } ${getRankMedalStyle(entry.rank)}`}
      >
        {entry.rank}
      </span>

      <ProfileAvatar
        name={entry.name}
        avatarUrl={entry.avatar_url}
        size={featured ? "lg" : "md"}
      />

      <div className={`min-w-0 flex-1 ${featured ? "sm:w-full" : ""}`}>
        <p
          className={`truncate font-semibold text-[var(--text-primary)] ${
            featured ? "text-base sm:text-lg" : ""
          }`}
        >
          {entry.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
          {[entry.sport, entry.region].filter(Boolean).join(" · ") || "競技未設定"}
        </p>
        {!featured ? (
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[var(--text-secondary)]">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5">
              フォロワー {entry.follower_score.toLocaleString("ja-JP")}
            </span>
            <span className="rounded-full bg-[var(--gold)]/10 px-2 py-0.5 text-[var(--gold-dark)]">
              いいね {entry.like_score.toLocaleString("ja-JP")}
            </span>
          </div>
        ) : null}
      </div>

      <div className={`shrink-0 text-right ${featured ? "sm:w-full sm:text-center" : ""}`}>
        <p className="text-[10px] text-[var(--text-muted)]">スコア</p>
        <p
          className={`font-bold text-[var(--gold-dark)] ${
            featured ? "text-lg" : "text-sm"
          }`}
        >
          {scoreLabel}
        </p>
      </div>
    </Link>
  );
}
