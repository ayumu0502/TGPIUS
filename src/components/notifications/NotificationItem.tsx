import { markNotificationReadAndGo } from "@/app/actions/notifications";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import {
  formatNotificationDate,
  getNotificationIcon,
  NOTIFICATION_TYPE_LABELS,
} from "@/lib/notifications/constants";
import type { NotificationRecord } from "@/types/notifications";

type NotificationItemProps = {
  notification: NotificationRecord;
};

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const markRead = markNotificationReadAndGo.bind(null, notification.id);

  return (
    <form action={markRead}>
      <button
        type="submit"
        className={`premium-card premium-card-hover flex w-full min-h-[72px] items-start gap-4 p-4 text-left transition-colors sm:min-h-0 ${
          notification.is_read
            ? "opacity-80"
            : "border-[var(--gold)]/30 bg-gradient-to-r from-[var(--gold)]/5 to-white"
        }`}
      >
        <div className="relative shrink-0">
          {notification.actor_name ? (
            <ProfileAvatar
              name={notification.actor_name}
              avatarUrl={notification.actor_avatar_url}
              size="sm"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)]/15 text-sm">
              {getNotificationIcon(notification.type)}
            </div>
          )}
          {!notification.is_read ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-gold rounded-full px-2 py-0.5 text-[10px] font-medium">
              {NOTIFICATION_TYPE_LABELS[notification.type]}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {formatNotificationDate(notification.created_at)}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {notification.title}
          </p>
          {notification.body ? (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
              {notification.body}
            </p>
          ) : null}
        </div>

        <span className="shrink-0 text-[var(--text-muted)]">›</span>
      </button>
    </form>
  );
}
