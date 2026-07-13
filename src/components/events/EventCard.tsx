import Link from "next/link";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import {
  AVAILABILITY_STYLES,
  formatEventDateTime,
  formatEventFee,
  formatEventLocation,
  getEventAvailability,
  LOCATION_TYPE_LABELS,
} from "@/lib/events/constants";
import type { EventSummary } from "@/types/events";

type EventCardProps = {
  event: EventSummary;
  compact?: boolean;
};

export default function EventCard({ event, compact = false }: EventCardProps) {
  const availability = getEventAvailability(event);

  return (
    <Link
      href={`/events/${event.id}`}
      className={`premium-card premium-card-hover block p-4 sm:p-5 ${
        compact ? "" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-[var(--text-primary)]">
              {event.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                AVAILABILITY_STYLES[availability]
              }`}
            >
              {availability}
            </span>
            {event.is_joined ? (
              <span className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--gold-dark)]">
                参加中
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {formatEventDateTime(event.starts_at)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {LOCATION_TYPE_LABELS[event.location_type]} · {formatEventLocation(event)}
          </p>

          {!compact ? (
            <p className="mt-3 line-clamp-2 text-sm text-[var(--text-secondary)]">
              {event.description || "詳細はイベントページをご確認ください"}
            </p>
          ) : null}
        </div>

        {!compact ? (
          <ProfileAvatar
            name={event.creator_name}
            avatarUrl={event.creator_avatar_url}
            size="md"
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
        <span className="rounded-full bg-zinc-100 px-2.5 py-1">
          {formatEventFee(event.fee_points)}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1">
          {event.participant_count}/{event.capacity}名
        </span>
        <span>{event.creator_name}</span>
      </div>
    </Link>
  );
}
