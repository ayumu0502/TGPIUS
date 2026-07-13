import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import {
  getNotifications,
} from "@/app/actions/notifications";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import NotificationList from "@/components/notifications/NotificationList";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = {
  title: "通知 | TGPLUS",
  description: "いいね・コメント・ギフト・DMなどの通知",
};

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [notifications, layoutCounts] = await Promise.all([
    getNotifications(),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="notifications"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">通知</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              いいね・コメント・ギフト・DM・ポイント購入・お知らせ
            </p>
          </div>
          <NotificationList notifications={notifications} />
        </div>
      </div>
    </PremiumLayout>
  );
}
