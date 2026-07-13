import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { AuthAlert } from "@/components/auth/AuthInput";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = {
  title: "購入キャンセル | TGPLUS",
  description: "ポイント購入がキャンセルされました",
};

export default async function PointPurchaseCancelPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "fan") {
    redirect(`/${profile.account_type}/dashboard`);
  }

  const layoutCounts = await getPremiumLayoutCounts(profile.account_type);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="points"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:px-8">
        <div className="premium-card p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] text-2xl text-[var(--text-muted)]">
            ×
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">購入がキャンセルされました</h1>
          <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
            決済は完了していません。ポイントは追加されていません。
          </p>

          <div className="mt-6">
            <AuthAlert
              type="error"
              message="Stripe Checkout を中断したか、決済に失敗しました"
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/points/purchase" className="btn-gold rounded-full px-6 py-3 text-sm">
              もう一度購入する
            </Link>
            <Link href="/fan/dashboard" className="btn-gold-outline rounded-full px-6 py-3 text-sm">
              ダッシュボードへ
            </Link>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
