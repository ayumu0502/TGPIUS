"use client";

import FollowUserCard from "@/components/follows/FollowUserCard";
import { ProfileEmptyState } from "@/components/profile/ProfileStates";
import type { RecommendedAthlete } from "@/types/follows";

type RecommendedAthletesProps = {
  athletes: RecommendedAthlete[];
  currentUserId: string;
  title?: string;
  compact?: boolean;
};

export default function RecommendedAthletes({
  athletes,
  currentUserId,
  title = "おすすめ選手",
  compact = false,
}: RecommendedAthletesProps) {
  if (athletes.length === 0) {
    return (
      <ProfileEmptyState
        title="おすすめ選手はありません"
        description="フォロー中の選手が多い場合は、新しいおすすめが表示されにくくなります"
      />
    );
  }

  if (compact) {
    return (
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {athletes.map((athlete) => (
          <FollowUserCard
            key={athlete.id}
            user={athlete}
            currentUserId={currentUserId}
            compact
            showMutualBadge={false}
          />
        ))}
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {athletes.map((athlete) => (
          <FollowUserCard
            key={athlete.id}
            user={athlete}
            currentUserId={currentUserId}
            showMutualBadge={false}
          />
        ))}
      </div>
    </section>
  );
}
