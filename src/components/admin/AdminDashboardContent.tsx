import Link from "next/link";
import {
  DashboardSection,
  StatCard,
} from "@/components/dashboard/DashboardUI";
import AdminAthleteEarnings from "@/components/admin/AdminAthleteEarnings";
import AdminFanclubAnalytics from "@/components/admin/AdminFanclubAnalytics";
import AdminFailedPayments from "@/components/admin/AdminFailedPayments";
import AdminGiftHistory from "@/components/admin/AdminGiftHistory";
import AdminPayoutPanel from "@/components/admin/AdminPayoutPanel";
import AdminPurchaseHistory from "@/components/admin/AdminPurchaseHistory";
import AdminSalesHistory from "@/components/admin/AdminSalesHistory";
import AdminSubscriptionPanel from "@/components/admin/AdminSubscriptionPanel";
import AdminUserTable from "@/components/admin/AdminUserTable";
import { formatYen } from "@/lib/admin/constants";
import { formatPoints } from "@/lib/points/constants";
import type {
  AdminAthleteEarning,
  AdminBillingRecord,
  AdminGift,
  AdminPayment,
  AdminPointPurchase,
  AdminStats,
  AdminUser,
} from "@/types/admin";
import type { FanclubAdminAnalytics } from "@/types/fanclub";
import type { PayoutRequest } from "@/types/subscription";

type AdminDashboardContentProps = {
  stats: AdminStats;
  users: AdminUser[];
  sales: AdminPayment[];
  purchases: AdminPointPurchase[];
  gifts: AdminGift[];
  fanclubAnalytics: FanclubAdminAnalytics;
  searchQuery: string;
  pendingPayouts: PayoutRequest[];
  subscriptionStats: { activeCount: number; totalCount: number };
  failedPayments: AdminBillingRecord[];
  athleteEarnings: AdminAthleteEarning[];
};

export default function AdminDashboardContent({
  stats,
  users,
  sales,
  purchases,
  gifts,
  fanclubAnalytics,
  searchQuery,
  pendingPayouts,
  subscriptionStats,
  failedPayments,
  athleteEarnings,
}: AdminDashboardContentProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard
          label="ユーザー数"
          value={stats.totalUsers.toLocaleString("ja-JP")}
          sub="全アカウント"
          highlight
        />
        <StatCard
          label="アスリート"
          value={stats.athleteCount.toLocaleString("ja-JP")}
          sub="登録数"
        />
        <StatCard
          label="スポンサー"
          value={stats.sponsorCount.toLocaleString("ja-JP")}
          sub="登録数"
        />
        <StatCard
          label="ファン"
          value={stats.fanCount.toLocaleString("ja-JP")}
          sub="登録数"
        />
        <StatCard
          label="総売上"
          value={formatYen(stats.totalRevenue)}
          sub="決済完了分"
        />
        <StatCard
          label="運営手数料"
          value={formatYen(stats.platformFeeTotal)}
          sub="累計"
        />
        <StatCard
          label="ギフト送信"
          value={`${stats.giftCount.toLocaleString("ja-JP")}件`}
          sub="累計"
        />
        <StatCard
          label="ポイント購入"
          value={`${stats.purchaseCount.toLocaleString("ja-JP")}件`}
          sub="累計"
        />
        <StatCard
          label="ギフト売上"
          value={formatPoints(stats.giftRevenue)}
          sub="累計ポイント"
        />
        <StatCard
          label="サブスク売上"
          value={formatYen(stats.subscriptionRevenue)}
          sub="請求済み"
        />
        <StatCard
          label="返金"
          value={formatYen(stats.refundTotal)}
          sub="累計"
        />
        <StatCard
          label="決済失敗"
          value={`${stats.failedPaymentCount.toLocaleString("ja-JP")}件`}
          sub="累計"
        />
      </div>

      <DashboardSection
        title="選手申請・審査"
        description="アスリート登録申請の確認と承認"
        action={
          <Link
            href="/admin/applications"
            className="btn-gold rounded-full px-5 py-2.5 text-sm"
          >
            申請一覧を開く
          </Link>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          本人確認書類の確認、承認・却下・再提出依頼は申請管理画面で行えます。
        </p>
      </DashboardSection>

      <DashboardSection
        title="ユーザー管理"
        description="検索・停止・再開はユーザー管理ページで"
        action={
          <Link href="/admin/users" className="btn-gold rounded-full px-5 py-2.5 text-sm">
            ユーザー一覧
          </Link>
        }
      >
        <AdminUserTable users={users.slice(0, 8)} searchQuery={searchQuery} />
      </DashboardSection>

      <DashboardSection
        title="売上一覧"
        description="ポイント購入・サポーター月額の売上（TGPLUS運営Stripe口座で受領）"
      >
        <AdminSalesHistory sales={sales} />
      </DashboardSection>

      <DashboardSection
        title="ポイント購入履歴"
        description="最近のポイント購入トランザクション"
      >
        <AdminPurchaseHistory purchases={purchases} />
      </DashboardSection>

      <DashboardSection
        title="ギフト履歴"
        description="最近送信されたギフト"
      >
        <AdminGiftHistory gifts={gifts} />
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSubscriptionPanel
          activeCount={subscriptionStats.activeCount}
          totalCount={subscriptionStats.totalCount}
        />
        <AdminPayoutPanel requests={pendingPayouts} />
      </div>

      <DashboardSection
        title="決済失敗"
        description="サブスク・ポイント購入の失敗記録"
      >
        <AdminFailedPayments records={failedPayments} />
      </DashboardSection>

      <DashboardSection
        title="アスリート別売上"
        description="ギフト売上ランキング（手取りポイント）"
      >
        <AdminAthleteEarnings earnings={athleteEarnings} />
      </DashboardSection>

      <AdminFanclubAnalytics analytics={fanclubAnalytics} />
    </div>
  );
}
