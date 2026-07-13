import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getFanGiftStats,
  getSentGifts,
  listAthletes,
} from "@/app/actions/gifts";
import { getCurrentProfile } from "@/app/actions/auth";
import GiftAthleteList from "@/components/gifts/GiftAthleteList";
import GiftHistoryList from "@/components/gifts/GiftHistoryList";
import { DashboardSection, StatCard } from "@/components/dashboard/DashboardUI";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import { formatPoints } from "@/lib/gifts/constants";

export const metadata: Metadata = {
  title: "ギフト | TGPLUS",
  description: "アスリートへポイントギフトを送る",
};

export default async function FanGiftsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "fan") {
    redirect(`/${profile.account_type}/dashboard`);
  }

  const [stats, sentGifts, athletes, layoutCounts] = await Promise.all([
    getFanGiftStats(),
    getSentGifts(),
    listAthletes(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="gifts"
      pointBalance={stats.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="ポイント残高"
            value={formatPoints(stats.pointBalance)}
            sub="テスト用ポイント"
            highlight
          />
          <StatCard
            label="送信回数"
            value={`${stats.giftCount}回`}
            sub="これまでのギフト"
          />
          <StatCard
            label="送信合計"
            value={formatPoints(stats.totalReceived)}
            sub="累計ポイント"
          />
        </div>

        <DashboardSection
          title="アスリート一覧"
          description="ギフトを送る選手を選んでください"
        >
          <GiftAthleteList athletes={athletes} />
        </DashboardSection>

        <DashboardSection
          title="送信履歴"
          description="これまで送ったギフト"
          action={
            athletes.length > 0 ? (
              <Link
                href={`/gift/send/${athletes[0].id}`}
                className="btn-gold rounded-full px-5 py-2.5 text-sm"
              >
                ギフトを送る
              </Link>
            ) : null
          }
        >
          <GiftHistoryList
            gifts={sentGifts}
            mode="sent"
            emptyMessage="まだギフトを送っていません"
            variant="light"
          />
        </DashboardSection>
      </div>
    </PremiumLayout>
  );
}
