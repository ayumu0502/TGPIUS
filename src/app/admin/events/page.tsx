import type { Metadata } from "next";
import { adminCancelEvent, listEventsForAdmin } from "@/app/actions/admin-moderation";
import AdminConfirmForm from "@/components/admin/AdminConfirmForm";
import { formatAdminDate } from "@/lib/admin/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "イベント管理",
  description: "TGPLUS イベント管理",
  path: "/admin/events",
  noIndex: true,
});

export default async function AdminEventsPage() {
  const events = await listEventsForAdmin();

  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          イベント管理
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">イベントの確認とキャンセル</p>
      </div>

      <div className="premium-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3">タイトル</th>
              <th className="px-4 py-3">作成者</th>
              <th className="px-4 py-3">開催日</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3">定員/参加費</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  イベントがありません
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{event.title}</td>
                  <td className="px-4 py-3">{event.creator_name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {formatAdminDate(event.starts_at)}
                  </td>
                  <td className="px-4 py-3">{event.status}</td>
                  <td className="px-4 py-3 text-xs">
                    {event.capacity}名 / {event.fee_points}pt
                  </td>
                  <td className="px-4 py-3">
                    {event.status !== "cancelled" ? (
                      <AdminConfirmForm
                        action={adminCancelEvent}
                        confirmMessage={`「${event.title}」をキャンセルしますか？`}
                        hiddenFields={{ event_id: event.id, note: "管理者によるキャンセル" }}
                        buttonLabel="キャンセル"
                      />
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
