import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getPointBalance } from "@/app/actions/gifts";
import { AuthAlert } from "@/components/auth/AuthInput";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import { formatPoints } from "@/lib/points/constants";
import { fulfillCheckoutSessionAfterReturn } from "@/lib/stripe/fulfill-session";

export const metadata: Metadata = {
  title: "購入完了 | TGPLUS",
  description: "ポイント購入が完了しました",
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PointPurchaseSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "fan") {
    redirect(`/${profile.account_type}/dashboard`);
  }

  const { session_id: sessionId } = await searchParams;
  let pointAmount: number | null = null;
  let paymentStatus: string | null = null;
  let fulfilled = false;

  if (sessionId) {
    const result = await fulfillCheckoutSessionAfterReturn(sessionId);
    pointAmount = result.pointAmount;
    paymentStatus = result.paymentStatus;
    fulfilled = result.fulfilled;
  }

  const [pointBalance, layoutCounts] = await Promise.all([
    getPointBalance(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="points"
      pointBalance={pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:px-8">
        <div className="premium-card p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">購入が完了しました</h1>
          <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
            {pointAmount
              ? `${pointAmount.toLocaleString("ja-JP")} pt が残高に反映されます`
              : "ポイントが残高に反映されます"}
          </p>
          {paymentStatus === "paid" ? (
            <div className="mt-4">
              <AuthAlert
                type="success"
                message={
                  fulfilled
                    ? "決済が完了し、ポイントが残高に反映されました"
                    : "決済が正常に完了しました。残高の反映まで少しお待ちください"
                }
              />
            </div>
          ) : (
            <p className="ja-body mt-4 text-xs text-[var(--text-muted)]">
              反映まで数秒かかる場合があります。残高をご確認ください。
            </p>
          )}

          <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4">
            <p className="text-xs text-[var(--text-muted)]">現在のポイント残高</p>
            <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
              {formatPoints(pointBalance)}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/fan/gifts" className="btn-gold rounded-full px-6 py-3 text-sm">
              ギフトを送る
            </Link>
            <Link
              href="/points/purchase"
              className="btn-gold-outline rounded-full px-6 py-3 text-sm"
            >
              購入ページに戻る
            </Link>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
