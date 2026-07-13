"use client";

import { useActionState } from "react";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import NotificationItem from "@/components/notifications/NotificationItem";
import EmptyState from "@/components/ui/EmptyState";
import type { NotificationRecord } from "@/types/notifications";

type NotificationListProps = {
  notifications: NotificationRecord[];
};

export default function NotificationList({
  notifications,
}: NotificationListProps) {
  const [state, formAction, isPending] = useActionState(
    markAllNotificationsRead,
    null
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          {unreadCount > 0
            ? `未読 ${unreadCount}件`
            : "すべて既読です"}
        </p>
        {unreadCount > 0 ? (
          <form action={formAction}>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full border border-[var(--card-border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-dark)] disabled:opacity-40"
            >
              {isPending ? "処理中..." : "すべて既読にする"}
            </button>
          </form>
        ) : null}
      </div>

      {state?.success ? (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          {state.success}
        </p>
      ) : null}
      {state?.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      {notifications.length === 0 ? (
        <EmptyState
          title="通知はありません"
          description="ギフト・メッセージ・イベントなどのお知らせがここに表示されます"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
}
