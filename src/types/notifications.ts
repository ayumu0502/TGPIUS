export type NotificationType =
  | "like"
  | "comment"
  | "gift"
  | "dm"
  | "follow"
  | "point_purchase"
  | "announcement"
  | "athlete_application";

export type NotificationRecord = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar_url: string | null;
};

export type NotificationActionState = {
  error?: string;
  success?: string;
};
