export type EventLocationType = "offline" | "online" | "hybrid";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventParticipantStatus = "registered" | "cancelled" | "checked_in";
export type EventAvailability = "受付中" | "満席" | "終了" | "キャンセル";

export type EventSummary = {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar_url: string | null;
  creator_sport: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  location_type: EventLocationType;
  venue_name: string;
  venue_address: string;
  online_url: string;
  capacity: number;
  fee_points: number;
  status: EventStatus;
  checkin_code: string | null;
  participant_count: number;
  is_joined: boolean;
  is_creator: boolean;
  created_at: string;
};

export type EventParticipant = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  status: EventParticipantStatus;
  registered_at: string;
  checked_in_at: string | null;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  location_type: EventLocationType;
  venue_name?: string;
  venue_address?: string;
  online_url?: string;
  capacity: number;
  fee_points: number;
  status?: EventStatus;
};

export type EventActionState = {
  ok: boolean;
  message: string;
};
