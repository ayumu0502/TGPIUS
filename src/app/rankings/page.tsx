import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentProfile } from "@/app/actions/auth";
import { getRankingsPageData } from "@/app/actions/rankings";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import RankingFilters from "@/components/rankings/RankingFilters";
import RankingList from "@/components/rankings/RankingList";
import RankingTabs, { RankingPeriodTabs } from "@/components/rankings/RankingTabs";
import { RANKING_CATEGORIES } from "@/lib/rankings/constants";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import type { RankingCategory, RankingFilters as RankingFiltersType, RankingPeriod } from "@/types/rankings";

export const metadata: Metadata = {
  title: "ランキング | TGPLUS",
  description: "選手の応援ランキングをチェック",
};

type RankingsPageProps = {
  searchParams: Promise<{
    category?: string;
    period?: string;
    sport?: string;
    region?: string;
  }>;
};

const CATEGORY_VALUES = RANKING_CATEGORIES.map((item) => item.value);
const PERIOD_VALUES: RankingPeriod[] = ["day", "week", "month", "all"];

function parseFilters(params: {
  category?: string;
  period?: string;
  sport?: string;
  region?: string;
}): RankingFiltersType {
  const category = CATEGORY_VALUES.includes(params.category as RankingCategory)
    ? (params.category as RankingCategory)
    : "overall";

  const categoryMeta = RANKING_CATEGORIES.find((item) => item.value === category);
  const defaultPeriod = categoryMeta?.fixedPeriod ?? "month";
  const period = PERIOD_VALUES.includes(params.period as RankingPeriod)
    ? (params.period as RankingPeriod)
    : defaultPeriod;

  return {
    category,
    period: categoryMeta?.fixedPeriod ?? period,
    sport: params.sport?.trim() ?? "",
    region: params.region?.trim() ?? "",
  };
}

export default async function RankingsPage({ searchParams }: RankingsPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const filters = parseFilters(params);

  const [layoutCounts, pageData] = await Promise.all([
    getPremiumLayoutCounts(profile.account_type),
    getRankingsPageData(filters),
  ]);

  const category = filters.category ?? "overall";

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="rankings"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              ランキング
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              ギフト・フォロワー・いいねから算出した選手ランキング
            </p>
          </div>

          <Suspense fallback={null}>
            <RankingTabs />
          </Suspense>

          <Suspense fallback={null}>
            <RankingPeriodTabs />
          </Suspense>

          <Suspense fallback={null}>
            <RankingFilters filterOptions={pageData.filterOptions} />
          </Suspense>

          <RankingList entries={pageData.entries} category={category} />
        </div>
      </div>
    </PremiumLayout>
  );
}
