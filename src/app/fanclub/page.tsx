import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { listFanclubCatalog } from "@/app/actions/fanclub";
import FanclubCatalogCard from "@/components/fanclub/FanclubCatalogCard";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "ファンクラブ",
  description: "推しの選手ファンクラブに加入しよう",
  path: "/fanclub",
});

export default async function FanclubPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [catalog, layoutCounts] = await Promise.all([
    listFanclubCatalog(50),
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
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">ファンクラブ</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                月額サブスクで会員限定コンテンツを楽しもう
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.account_type === "fan" ? (
                <Link
                  href="/fan/subscriptions"
                  className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--gold)]"
                >
                  マイサブスク
                </Link>
              ) : null}
              {profile.account_type === "athlete" ? (
                <Link href="/athlete/fanclub" className="btn-gold rounded-full px-4 py-2 text-sm">
                  管理画面
                </Link>
              ) : null}
            </div>
          </div>

          {catalog.length === 0 ? (
            <div className="premium-card px-6 py-16 text-center">
              <p className="text-[var(--text-muted)]">
                公開中のファンクラブはまだありません
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.map((item) => (
                <FanclubCatalogCard key={item.athlete_id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PremiumLayout>
  );
}
