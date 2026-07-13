import type {
  EventAvailability,
  EventLocationType,
  EventStatus,
  EventSummary,
} from "@/types/events";

export const LOCATION_TYPE_LABELS: Record<EventLocationType, string> = {
  offline: "対面",
  online: "オンライン",
  hybrid: "ハイブリッド",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "下書き",
  published: "公開中",
  cancelled: "キャンセル",
  completed: "完了",
};

export const AVAILABILITY_STYLES: Record<EventAvailability, string> = {
  受付中: "bg-green-100 text-green-700",
  満席: "bg-amber-100 text-amber-700",
  終了: "bg-zinc-100 text-zinc-600",
  キャンセル: "bg-red-100 text-red-700",
};

export function getEventAvailability(event: EventSummary): EventAvailability {
  if (event.status === "cancelled") return "キャンセル";
  if (new Date(event.starts_at) <= new Date()) return "終了";
  if (event.participant_count >= event.capacity) return "満席";
  return "受付中";
}

export function formatEventDateTime(value: string): string {
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEventFee(feePoints: number): string {
  if (feePoints <= 0) return "無料";
  return `${feePoints.toLocaleString("ja-JP")} pt`;
}

export function formatEventLocation(event: EventSummary): string {
  if (event.location_type === "online") {
    return event.online_url ? "オンライン" : "オンライン（URL未設定）";
  }
  if (event.location_type === "hybrid") {
    const parts = [event.venue_name, event.online_url ? "オンライン併用" : ""]
      .filter(Boolean)
      .join(" / ");
    return parts || "ハイブリッド";
  }
  return event.venue_name || event.venue_address || "会場未定";
}

export function getCheckinUrl(eventId: string, checkinCode: string, origin: string): string {
  return `${origin}/events/${eventId}?checkin=${encodeURIComponent(checkinCode)}`;
}
