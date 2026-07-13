import RankingCard from "@/components/rankings/RankingCard";
import RankingPodium from "@/components/rankings/RankingPodium";
import type { AthleteRankingEntry, RankingCategory } from "@/types/rankings";

type RankingListProps = {
  entries: AthleteRankingEntry[];
  category: RankingCategory;
};

export default function RankingList({ entries, category }: RankingListProps) {
  if (entries.length === 0) {
    return (
      <div className="premium-card px-6 py-16 text-center">
        <p className="text-[var(--text-muted)]">
          ランキングデータがまだありません
        </p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          ギフト送信やフォローでランキングが更新されます
        </p>
      </div>
    );
  }

  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {entries.length >= 1 ? (
        <RankingPodium entries={entries} category={category} />
      ) : null}

      {rest.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
            4位以降
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((entry) => (
              <RankingCard key={entry.id} entry={entry} category={category} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
