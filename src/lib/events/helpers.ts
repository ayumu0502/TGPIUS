import type { EventParticipant, EventSummary } from "@/types/events";

export function mapEventSummary(row: Record<string, unknown>): EventSummary {
  return {
    id: String(row.id),
    creator_id: String(row.creator_id),
    creator_name: String(row.creator_name ?? ""),
    creator_avatar_url: row.creator_avatar_url
      ? String(row.creator_avatar_url)
      : null,
    creator_sport: String(row.creator_sport ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    starts_at: String(row.starts_at ?? ""),
    ends_at: row.ends_at ? String(row.ends_at) : null,
    location_type: row.location_type as EventSummary["location_type"],
    venue_name: String(row.venue_name ?? ""),
    venue_address: String(row.venue_address ?? ""),
    online_url: String(row.online_url ?? ""),
    capacity: Number(row.capacity ?? 0),
    fee_points: Number(row.fee_points ?? 0),
    status: row.status as EventSummary["status"],
    checkin_code: row.checkin_code ? String(row.checkin_code) : null,
    participant_count: Number(row.participant_count ?? 0),
    is_joined: Boolean(row.is_joined),
    is_creator: Boolean(row.is_creator),
    created_at: String(row.created_at ?? ""),
  };
}

export function mapEventParticipant(row: Record<string, unknown>): EventParticipant {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    user_name: String(row.user_name ?? ""),
    user_avatar_url: row.user_avatar_url ? String(row.user_avatar_url) : null,
    status: row.status as EventParticipant["status"],
    registered_at: String(row.registered_at ?? ""),
    checked_in_at: row.checked_in_at ? String(row.checked_in_at) : null,
  };
}
