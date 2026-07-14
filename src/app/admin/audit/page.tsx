import type { Metadata } from "next";
import { getAdminAuditLog } from "@/app/actions/admin-moderation";
import { formatAdminDate } from "@/lib/admin/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "監査ログ",
  description: "TGPLUS 管理者監査ログ",
  path: "/admin/audit",
  noIndex: true,
});

export default async function AdminAuditPage() {
  const entries = await getAdminAuditLog(150);

  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          監査ログ
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          管理者の重要操作履歴（停止・削除・通報対応など）
        </p>
      </div>

      <div className="premium-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3">日時</th>
              <th className="px-4 py-3">管理者</th>
              <th className="px-4 py-3">操作</th>
              <th className="px-4 py-3">対象</th>
              <th className="px-4 py-3">メモ</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  監査ログがありません（admin-console-schema.sql 実行後に記録されます）
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {formatAdminDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3">{entry.admin_name}</td>
                  <td className="px-4 py-3 font-medium">{entry.action}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {entry.target_type}
                    {entry.target_id ? ` · ${entry.target_id.slice(0, 8)}…` : ""}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-[var(--text-muted)]">
                    {entry.note || "—"}
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
