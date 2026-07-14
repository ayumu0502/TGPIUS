import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireApprovedAthlete } from "@/app/actions/athlete-access";
import { getAthleteFanclubManage } from "@/app/actions/fanclub";
import AthleteFanclubManagePanel from "@/components/fanclub/AthleteFanclubManagePanel";
import AthleteFanclubPostForm from "@/components/fanclub/AthleteFanclubPostForm";
import {
  FanclubMemberGrowthChart,
  FanclubMembersList,
  FanclubStatsCards,
} from "@/components/fanclub/AthleteFanclubStats";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "ファンクラブ管理",
  description: "月額プランと会員を管理",
  path: "/athlete/fanclub",
});

export default async function AthleteFanclubPage() {
  const profile = await requireApprovedAthlete();

  const [manageData, layoutCounts] = await Promise.all([
    getAthleteFanclubManage(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="fanclub"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                ファンクラブ管理
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                月額プラン・会員・限定コンテンツを管理
              </p>
            </div>
            <Link
              href={`/fanclub/${profile.id}`}
              className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--gold)]"
            >
              公開ページを見る
            </Link>
          </div>

          <FanclubStatsCards stats={manageData.stats} />

          <div className="grid gap-6 lg:grid-cols-2">
            <FanclubMemberGrowthChart data={manageData.stats.member_growth} />
            <FanclubMembersList members={manageData.members} />
          </div>

          <AthleteFanclubManagePanel plans={manageData.plans} />
          <AthleteFanclubPostForm plans={manageData.plans} />
        </div>
      </div>
    </PremiumLayout>
  );
}
