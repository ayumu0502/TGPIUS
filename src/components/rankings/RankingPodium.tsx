import RankingCard from "@/components/rankings/RankingCard";
import type { AthleteRankingEntry, RankingCategory } from "@/types/rankings";

type RankingPodiumProps = {
  entries: AthleteRankingEntry[];
  category: RankingCategory;
};

export default function RankingPodium({ entries, category }: RankingPodiumProps) {
  const topThree = entries.slice(0, 3);
  if (topThree.length === 0) return null;

  const order = [
    topThree.find((e) => e.rank === 2),
    topThree.find((e) => e.rank === 1),
    topThree.find((e) => e.rank === 3),
  ].filter(Boolean) as AthleteRankingEntry[];

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
      {order.map((entry) => (
        <div
          key={entry.id}
          className={entry.rank === 1 ? "sm:order-2 sm:-mt-2" : entry.rank === 2 ? "sm:order-1" : "sm:order-3"}
        >
          <RankingCard entry={entry} category={category} featured={entry.rank === 1} />
        </div>
      ))}
    </div>
  );
}
