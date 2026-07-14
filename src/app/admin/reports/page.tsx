import type { Metadata } from "next";
import { listUserReports, updateReportStatus } from "@/app/actions/admin-moderation";
import AdminConfirmForm from "@/components/admin/AdminConfirmForm";
import { formatAdminDate } from "@/lib/admin/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "通報管理",
  description: "TGPLUS 通報管理",
  path: "/admin/reports",
  noIndex: true,
});

type AdminReportsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const { status } = await searchParams;
  const statusFilter = status ?? "pending";
  const reports = await listUserReports(statusFilter);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            通報管理
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">ユーザーからの通報一覧</p>
        </div>
        <form method="get" className="flex gap-2">
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-xl border border-[var(--card-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="pending">未対応</option>
            <option value="reviewed">確認済み</option>
            <option value="resolved">解決済み</option>
            <option value="dismissed">却下</option>
            <option value="all">すべて</option>
          </select>
          <button type="submit" className="btn-gold rounded-full px-4 py-2 text-sm">
            絞り込み
          </button>
        </form>
      </div>

      <div className="premium-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3">通報者</th>
              <th className="px-4 py-3">対象</th>
              <th className="px-4 py-3">理由</th>
              <th className="px-4 py-3">種別</th>
              <th className="px-4 py-3">日時</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  通報はありません
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-4 py-3">{report.reporter_name}</td>
                  <td className="px-4 py-3">{report.reported_name}</td>
                  <td className="max-w-xs px-4 py-3 text-[var(--text-secondary)]">
                    {report.reason}
                  </td>
                  <td className="px-4 py-3 text-xs">{report.context_type}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {formatAdminDate(report.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(["reviewed", "resolved", "dismissed"] as const).map((nextStatus) => (
                        <AdminConfirmForm
                          key={nextStatus}
                          action={updateReportStatus}
                          confirmMessage={`この通報を「${nextStatus}」に更新しますか？`}
                          hiddenFields={{ report_id: report.id, status: nextStatus }}
                          buttonLabel={nextStatus}
                          buttonClassName="rounded-full border border-[var(--card-border)] px-2.5 py-1 text-xs hover:border-[var(--gold)]"
                        />
                      ))}
                    </div>
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
