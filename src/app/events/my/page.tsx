import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import {
  listMyCreatedEvents,
  listMyJoinedEvents,
} from "@/app/actions/events";
import EventList from "@/components/events/EventList";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = {
  title: "マイイベント | TGPLUS",
  description: "参加中・作成したイベント",
};

export default async function MyEventsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isAthlete = profile.account_type === "athlete";

  const [joinedEvents, createdEvents, layoutCounts] = await Promise.all([
    listMyJoinedEvents(50),
    isAthlete ? listMyCreatedEvents(50) : Promise.resolve([]),
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
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                マイイベント
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                参加登録中のイベントと作成したイベント
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/events"
                className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--gold)]"
              >
                イベント一覧
              </Link>
              {isAthlete ? (
                <Link href="/events/create" className="btn-gold rounded-full px-4 py-2 text-sm">
                  新規作成
                </Link>
              ) : null}
            </div>
          </div>

          <section>
            <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
              参加中のイベント
            </h2>
            <EventList
              events={joinedEvents}
              emptyMessage="参加中のイベントはありません"
            />
          </section>

          {isAthlete ? (
            <section>
              <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
                作成したイベント
              </h2>
              <EventList
                events={createdEvents}
                emptyMessage="作成したイベントはありません"
              />
            </section>
          ) : null}
        </div>
      </div>
    </PremiumLayout>
  );
}
