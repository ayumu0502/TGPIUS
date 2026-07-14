import type { Metadata } from "next";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { listUpcomingEvents } from "@/app/actions/events";
import EventList from "@/components/events/EventList";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "イベント",
  description: "アスリートのイベントに参加しよう",
  path: "/events",
});

export default async function EventsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [events, layoutCounts] = await Promise.all([
    listUpcomingEvents(50),
    getPremiumLayoutCounts(profile.account_type),
  ]);

  return (
    <PremiumLayout
      currentUser={{
        id: profile.id,
        name: profile.name,
        accountType: profile.account_type,
      }}
      activeNav="events"
      pointBalance={layoutCounts.pointBalance}
      notificationCount={layoutCounts.notificationCount}
      messageUnreadCount={layoutCounts.messageUnreadCount}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                イベント
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                ファンミーティングやオンラインイベントに参加できます
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/events/my"
                className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--gold)]"
              >
                マイイベント
              </Link>
              {profile.account_type === "athlete" ? (
                <Link href="/events/create" className="btn-gold rounded-full px-4 py-2 text-sm">
                  イベント作成
                </Link>
              ) : null}
            </div>
          </div>

          <EventList events={events} emptyMessage="現在参加可能なイベントはありません" />
        </div>
      </div>
    </PremiumLayout>
  );
}
