import type { Metadata } from "next";
import {
  getAdminStats,
  getAthleteEarningsBreakdown,
  getFailedBillingRecords,
  getPendingPayouts,
  getRecentGifts,
  getRecentPointPurchases,
  getRecentSales,
  getRecentUsers,
  getSubscriptionStats,
  searchUsers,
} from "@/app/actions/admin";
import { getAdminFanclubAnalytics } from "@/app/actions/fanclub";
import AdminDashboardContent from "@/components/admin/AdminDashboardContent";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "管理者ダッシュボード",
  description: "TGPLUS 管理コンソール",
  path: "/admin/dashboard",
  noIndex: true,
});

type AdminDashboardPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const { q } = await searchParams;
  const searchQuery = q?.trim() ?? "";

  const [stats, users, sales, purchases, gifts, fanclubAnalytics, pendingPayouts, subscriptionStats, failedPayments, athleteEarnings] =
    await Promise.all([
      getAdminStats(),
      searchQuery ? searchUsers(searchQuery) : getRecentUsers(15),
      getRecentSales(10),
      getRecentPointPurchases(10),
      getRecentGifts(10),
      getAdminFanclubAnalytics(),
      getPendingPayouts(),
      getSubscriptionStats(),
      getFailedBillingRecords(10),
      getAthleteEarningsBreakdown(15),
    ]);

  return (
    <AdminDashboardContent
      stats={stats}
      users={users}
      sales={sales}
      purchases={purchases}
      gifts={gifts}
      fanclubAnalytics={fanclubAnalytics}
      searchQuery={searchQuery}
      pendingPayouts={pendingPayouts}
      subscriptionStats={subscriptionStats}
      failedPayments={failedPayments}
      athleteEarnings={athleteEarnings}
    />
  );
}
