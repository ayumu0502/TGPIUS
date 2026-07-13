import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getCurrentAthleteEarnings } from "@/app/actions/earnings";
import AthleteEarningsDashboard from "@/components/connect/AthleteEarningsDashboard";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "売上管理",
  description: "ギフト・サブスク売上、出金申請・履歴を管理",
  path: "/athlete/earnings",
  noIndex: true,
});

export default async function AthleteEarningsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "athlete") {
    redirect(`/${profile.account_type}/dashboard`);
  }

  const [earnings, layoutCounts] = await Promise.all([
    getCurrentAthleteEarnings(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  if (!earnings.summary) redirect("/athlete/dashboard");

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
        avatarUrl: undefined,
      }}
      activeNav="dashboard"
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/athlete/dashboard"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--gold-dark)]"
          >
            ← ダッシュボード
          </Link>
          <h1 className="ja-heading mt-2 text-2xl font-bold text-[var(--text-primary)]">
            売上管理
          </h1>
          <p className="ja-body mt-1 text-sm text-[var(--text-muted)]">
            ギフト・サブスク売上と出金を管理
          </p>
        </div>

        <AthleteEarningsDashboard
          summary={earnings.summary}
          payouts={earnings.payouts}
        />
      </div>
    </PremiumLayout>
  );
}
