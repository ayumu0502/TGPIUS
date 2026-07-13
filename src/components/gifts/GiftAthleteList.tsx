import Link from "next/link";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import type { GiftAthleteSummary } from "@/types/gifts";

type GiftAthleteListProps = {
  athletes: GiftAthleteSummary[];
};

export default function GiftAthleteList({ athletes }: GiftAthleteListProps) {
  if (athletes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--surface)] px-4 py-12 text-center">
        <p className="text-[var(--text-muted)]">ギフトを送れるアスリートがまだいません</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {athletes.map((athlete) => (
        <div
          key={athlete.id}
          className="premium-card premium-card-hover flex items-center gap-4 p-4"
        >
          <ProfileAvatar
            name={athlete.name}
            avatarUrl={athlete.avatar_url}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[var(--text-primary)]">{athlete.name}</p>
            <p className="truncate text-sm text-[var(--text-muted)]">
              {athlete.sport || "競技未設定"}
            </p>
          </div>
          <Link
            href={`/gift/send/${athlete.id}`}
            className="btn-gold shrink-0 rounded-full px-4 py-2 text-xs"
          >
            ギフトを送る
          </Link>
        </div>
      ))}
    </div>
  );
}
