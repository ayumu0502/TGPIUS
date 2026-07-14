import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { ensureAccountType, ensureLoggedIn } from "@/lib/auth/page-guards";
import { listFanSubscriptions } from "@/app/actions/fanclub";
import FanSubscriptionsList from "@/components/fanclub/FanSubscriptionsList";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "マイサブスク",
  description: "加入中のファンクラブを管理",
  path: "/fan/subscriptions",
});

export default async function FanSubscriptionsPage() {
  const profile = ensureLoggedIn(await getCurrentProfile());
  ensureAccountType(profile, "fan");

  const [subscriptions, layoutCounts] = await Promise.all([
    listFanSubscriptions(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
        isAdmin: Boolean(profile.is_admin),
      }}
      activeNav="subscriptions"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                マイサブスク
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                加入中のファンクラブと会員ステータス
              </p>
            </div>
            <Link
              href="/fanclub"
              className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--gold)]"
            >
              ファンクラブを探す
            </Link>
          </div>

          <FanSubscriptionsList subscriptions={subscriptions} />
        </div>
      </div>
    </PremiumLayout>
  );
}
