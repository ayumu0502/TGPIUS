import type { Metadata } from "next";
import {
  getFailedBillingRecords,
  getRecentGifts,
  getRecentPointPurchases,
  getRecentSales,
} from "@/app/actions/admin";
import { getRefundRecords } from "@/app/actions/admin-moderation";
import AdminFailedPayments from "@/components/admin/AdminFailedPayments";
import AdminGiftHistory from "@/components/admin/AdminGiftHistory";
import AdminPurchaseHistory from "@/components/admin/AdminPurchaseHistory";
import AdminSalesHistory from "@/components/admin/AdminSalesHistory";
import { DashboardSection } from "@/components/dashboard/DashboardUI";
import { formatAdminDate, formatYen } from "@/lib/admin/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "決済・履歴",
  description: "TGPLUS 決済履歴管理",
  path: "/admin/payments",
  noIndex: true,
});

export default async function AdminPaymentsPage() {
  const [sales, purchases, gifts, failedPayments, refunds] = await Promise.all([
    getRecentSales(30),
    getRecentPointPurchases(30),
    getRecentGifts(30),
    getFailedBillingRecords(20),
    getRefundRecords(20),
  ]);

  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          決済・履歴
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Stripe決済・ポイント購入・ギフト・返金・失敗記録
        </p>
      </div>

      <div className="space-y-8">
        <DashboardSection title="Stripe売上" description="ポイント購入・サポーター月額">
          <AdminSalesHistory sales={sales} />
        </DashboardSection>

        <DashboardSection title="ポイント購入履歴" description="point_transactions">
          <AdminPurchaseHistory purchases={purchases} />
        </DashboardSection>

        <DashboardSection title="ギフト履歴" description="ファンからアスリートへのギフト">
          <AdminGiftHistory gifts={gifts} />
        </DashboardSection>

        <DashboardSection title="返金記録" description="billing_records (refund)">
          {refunds.length === 0 ? (
            <div className="premium-card px-4 py-8 text-center text-[var(--text-muted)]">
              返金記録はありません
            </div>
          ) : (
            <div className="space-y-3">
              {refunds.map((refund) => (
                <div key={refund.id} className="premium-card p-4">
                  <p className="font-medium">{refund.user_name}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {formatYen(refund.amount_yen)} · {refund.description || "返金"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {formatAdminDate(refund.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="決済失敗" description="サブスク・ポイント購入の失敗">
          <AdminFailedPayments records={failedPayments} />
        </DashboardSection>
      </div>
    </>
  );
}
