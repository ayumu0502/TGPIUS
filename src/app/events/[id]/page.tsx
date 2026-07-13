import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentProfile } from "@/app/actions/auth";
import { getEventById, getEventParticipants } from "@/app/actions/events";
import EventDetailView from "@/components/events/EventDetailView";
import PremiumLayout from "@/components/layout/premium/PremiumLayout";
import { getPremiumLayoutCounts } from "@/lib/premium/layout-counts";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return {
    title: event ? `${event.title} | TGPLUS` : "イベント | TGPLUS",
    description: event?.description || "イベント詳細",
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const [event, participants, layoutCounts, headerStore] = await Promise.all([
    getEventById(id),
    getEventParticipants(id),
    getPremiumLayoutCounts(profile.account_type),
    headers(),
  ]);

  if (!event) notFound();

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const siteOrigin = host ? `${protocol}://${host}` : "http://localhost:3000";

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
        <div className="mx-auto max-w-4xl">
          <EventDetailView
            event={event}
            participants={participants}
            currentUserId={profile.id}
            siteOrigin={siteOrigin}
          />
        </div>
      </div>
    </PremiumLayout>
  );
}
