import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentProfile } from "@/app/actions/auth";
import { getMyFollowingIds } from "@/app/actions/follows";
import {
  getAllDiscoverySections,
  getSearchFilterOptions,
  searchAthletes,
} from "@/app/actions/search";
import DiscoverySections from "@/components/search/DiscoverySections";
import SearchBar from "@/components/search/SearchBar";
import SearchFilters from "@/components/search/SearchFilters";
import AthleteSearchCard from "@/components/search/AthleteSearchCard";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import type { SearchFilters as SearchFiltersType, SearchSort } from "@/types/search";

export const metadata: Metadata = {
  title: "検索・発見 | TGPLUS",
  description: "選手やユーザーを検索して、推しを見つけよう",
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    sport?: string;
    region?: string;
    gender?: string;
    minFollowers?: string;
    sort?: string;
  }>;
};

function parseFilters(params: {
  q?: string;
  sport?: string;
  region?: string;
  gender?: string;
  minFollowers?: string;
  sort?: string;
}): SearchFiltersType {
  const sortValues: SearchSort[] = [
    "relevance",
    "followers",
    "gifts",
    "trending",
    "newest",
  ];
  const sort = sortValues.includes(params.sort as SearchSort)
    ? (params.sort as SearchSort)
    : "relevance";

  return {
    query: params.q?.trim() ?? "",
    sport: params.sport?.trim() ?? "",
    region: params.region?.trim() ?? "",
    gender: params.gender?.trim() ?? "",
    minFollowers: params.minFollowers
      ? Number(params.minFollowers)
      : undefined,
    sort,
  };
}

function hasActiveSearch(filters: SearchFiltersType): boolean {
  return Boolean(
    filters.query ||
      filters.sport ||
      filters.region ||
      filters.gender ||
      filters.minFollowers ||
      (filters.sort && filters.sort !== "relevance")
  );
}

async function SearchResults({
  filters,
  followingIds,
  currentUserId,
}: {
  filters: SearchFiltersType;
  followingIds: Set<string>;
  currentUserId: string;
}) {
  const results = await searchAthletes(filters, 48);

  if (results.length === 0) {
    return (
      <div className="premium-card px-6 py-16 text-center">
        <p className="text-[var(--text-muted)]">
          条件に一致する選手が見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        {results.length}件の選手
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((athlete) => (
          <AthleteSearchCard
            key={athlete.id}
            athlete={athlete}
            isFollowing={followingIds.has(athlete.id)}
            showFollowButton
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const filters = parseFilters(params);
  const showResults = hasActiveSearch(filters);

  const [layoutCounts, filterOptions, discovery, followingIdList] = await Promise.all([
    getPremiumLayoutCounts(profile.account_type),
    getSearchFilterOptions(),
    showResults ? Promise.resolve(null) : getAllDiscoverySections(),
    getMyFollowingIds(),
  ]);
  const followingIds = new Set(followingIdList);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="search"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              検索・発見
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              選手名・競技・地域・チーム・ユーザー名で探せます
            </p>
          </div>

          <SearchBar initialQuery={filters.query} />

          <Suspense fallback={null}>
            <SearchFilters filterOptions={filterOptions} />
          </Suspense>

          {showResults ? (
            <Suspense
              fallback={
                <div className="premium-card px-6 py-12 text-center text-[var(--text-muted)]">
                  検索中...
                </div>
              }
            >
              <SearchResults
                filters={filters}
                followingIds={followingIds}
                currentUserId={profile.id}
              />
            </Suspense>
          ) : discovery ? (
            <DiscoverySections
              sections={discovery}
              followingIds={followingIds}
              currentUserId={profile.id}
            />
          ) : null}
        </div>
      </div>
    </PremiumLayout>
  );
}
