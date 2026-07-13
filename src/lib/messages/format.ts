const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export function isUserOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMessageDateDivider(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "今日";
  if (isYesterday) return "昨日";

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function previewMessage(
  content: string,
  messageType: string,
  deleted: boolean
): string {
  if (deleted) return "メッセージが削除されました";
  if (messageType === "image") return "📷 画像";
  if (messageType === "file") return "📎 ファイル";
  return content || "";
}

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
