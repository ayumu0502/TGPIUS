import Link from "next/link";
import AthleteSearchCard from "@/components/search/AthleteSearchCard";
import type { AthleteSearchResult } from "@/types/search";

type DiscoverySectionsProps = {
  sections: Record<
    "popular" | "trending" | "new" | "recommended",
    AthleteSearchResult[]
  >;
  followingIds?: Set<string>;
  currentUserId?: string;
};

const SECTION_META = [
  { key: "popular" as const, title: "人気選手", href: "/search?sort=gifts" },
  { key: "trending" as const, title: "急上昇選手", href: "/search?sort=trending" },
  { key: "new" as const, title: "新着選手", href: "/search?sort=newest" },
  { key: "recommended" as const, title: "おすすめ選手", href: "/search?sort=relevance" },
];

export default function DiscoverySections({
  sections,
  followingIds = new Set(),
  currentUserId,
}: DiscoverySectionsProps) {
  return (
    <div className="space-y-8">
      {SECTION_META.map((section) => {
        const athletes = sections[section.key];
        if (athletes.length === 0) return null;

        return (
          <section key={section.key}>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {section.title}
                </h2>
              </div>
              <Link
                href={section.href}
                className="text-sm text-[var(--gold-dark)] hover:underline"
              >
                もっと見る ›
              </Link>
            </div>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {athletes.map((athlete) => (
                <AthleteSearchCard
                  key={athlete.id}
                  athlete={athlete}
                  compact
                  isFollowing={followingIds.has(athlete.id)}
                  showFollowButton={Boolean(currentUserId)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
