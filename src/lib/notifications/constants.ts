import type { NotificationType } from "@/types/notifications";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  like: "いいね",
  comment: "コメント",
  gift: "ギフト",
  dm: "DM",
  follow: "フォロー",
  point_purchase: "ポイント購入",
  announcement: "お知らせ",
};

export function formatNotificationDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    like: "♥",
    comment: "💬",
    gift: "🎁",
    dm: "✉",
    follow: "＋",
    point_purchase: "◎",
    announcement: "📢",
  };
  return icons[type];
}
