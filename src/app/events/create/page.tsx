import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireApprovedAthlete } from "@/app/actions/athlete-access";
import EventCreateForm from "@/components/events/EventCreateForm";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

export const metadata: Metadata = {
  title: "イベント作成 | TGPLUS",
  description: "新しいイベントを作成",
};

export default async function EventCreatePage() {
  const profile = await requireApprovedAthlete();

  const layoutCounts = await getPremiumLayoutCounts(profile.account_type);

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
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <Link
              href="/events/my"
              className="text-sm text-[var(--gold-dark)] hover:underline"
            >
              ← マイイベント
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
              イベント作成
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              ファンミーティングやオンラインイベントを公開できます
            </p>
          </div>

          <EventCreateForm />
        </div>
      </div>
    </PremiumLayout>
  );
}
