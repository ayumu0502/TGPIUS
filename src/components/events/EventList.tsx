import EventCard from "@/components/events/EventCard";
import type { EventSummary } from "@/types/events";

type EventListProps = {
  events: EventSummary[];
  emptyMessage?: string;
};

export default function EventList({
  events,
  emptyMessage = "イベントが見つかりませんでした",
}: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="premium-card px-6 py-16 text-center">
        <p className="text-[var(--text-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
