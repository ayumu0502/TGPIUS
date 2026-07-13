import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import {
  formatEventDateTime,
  formatEventFee,
  formatEventLocation,
  getEventAvailability,
  LOCATION_TYPE_LABELS,
} from "@/lib/events/constants";
import type { EventSummary } from "@/types/events";

type NextEventWidgetProps = {
  event: EventSummary | null;
  title?: string;
  href?: string;
};

export default function NextEventWidget({
  event,
  title = "次回イベント",
  href = "/events",
}: NextEventWidgetProps) {
  if (!event) {
    return (
      <div className="premium-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              参加可能なイベントはまだありません
            </p>
          </div>
          <Link href={href} className="text-xs text-[var(--gold-dark)] hover:underline">
            一覧 ›
          </Link>
        </div>
      </div>
    );
  }

  const availability = getEventAvailability(event);

  return (
    <div className="premium-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)] p-5">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            もうすぐ開催されるイベント
          </p>
        </div>
        <Link href={href} className="text-xs text-[var(--gold-dark)] hover:underline">
          すべて ›
        </Link>
      </div>
      <div className="p-5">
        <Link href={`/events/${event.id}`} className="block">
          <p className="font-semibold text-[var(--text-primary)] hover:text-[var(--gold-dark)]">
            {event.title}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {formatEventDateTime(event.starts_at)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {LOCATION_TYPE_LABELS[event.location_type]} · {formatEventLocation(event)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[var(--text-secondary)]">
              {formatEventFee(event.fee_points)}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[var(--text-secondary)]">
              {availability}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function CreatedEventsWidget({
  events,
}: {
  events: EventSummary[];
}) {
  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="premium-card px-5 py-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            作成したイベントはまだありません
          </p>
          <Link
            href="/events/create"
            className="btn-gold mt-4 inline-block rounded-full px-5 py-2 text-sm"
          >
            イベントを作成
          </Link>
        </div>
      ) : (
        events.slice(0, 3).map((event) => <EventCard key={event.id} event={event} compact />)
      )}
    </div>
  );
}
