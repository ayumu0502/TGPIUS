import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { getPublicProfile } from "@/app/actions/profile";
import AthleteProfileEditForm from "@/components/profile/AthleteProfileEditForm";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = {
  title: "プロフィール編集 | TGPLUS",
  description: "アスリートプロフィールを編集",
};

export default async function AthleteProfileEditPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login");
  if (current.account_type !== "athlete") {
    redirect(`/${current.account_type}/dashboard`);
  }

  const [profile, layoutCounts] = await Promise.all([
    getPublicProfile(current.id),
    getPremiumLayoutCounts(current.account_type),
  ]);
  if (!profile) redirect("/login");

  return (
    <PremiumLayout
      currentUser={{
        id: current.id,
        name: current.name,
        accountType: current.account_type,
      }}
      activeNav="profile"
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <AthleteProfileEditForm profile={profile} />
      </div>
    </PremiumLayout>
  );
}
