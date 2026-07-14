import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { ensureAccountType, ensureLoggedIn } from "@/lib/auth/page-guards";
import SponsorDashboardContent from "@/components/dashboard/SponsorDashboardContent";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "スポンサーダッシュボード",
  description: "スポンサー案件、契約選手、請求管理を一元管理。",
  path: "/sponsor/dashboard",
});

export default async function SponsorDashboardPage() {
  const profile = ensureLoggedIn(await getCurrentProfile());
  ensureAccountType(profile, "sponsor");

  const layoutCounts = await getPremiumLayoutCounts(profile.account_type);

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
        <SponsorDashboardContent />
      </div>
    </PremiumLayout>
  );
}
