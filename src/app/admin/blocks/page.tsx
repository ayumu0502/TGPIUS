import type { Metadata } from "next";
import { listUserBlocks } from "@/app/actions/admin-moderation";
import { formatAdminDate } from "@/lib/admin/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "ブロック状況",
  description: "TGPLUS ブロック管理",
  path: "/admin/blocks",
  noIndex: true,
});

export default async function AdminBlocksPage() {
  const blocks = await listUserBlocks();

  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          ブロック状況
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          ユーザー間のブロック一覧（双方向でDM不可）
        </p>
      </div>

      <div className="premium-card overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3">ブロックした人</th>
              <th className="px-4 py-3">ブロックされた人</th>
              <th className="px-4 py-3">日時</th>
            </tr>
          </thead>
          <tbody>
            {blocks.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  ブロックはありません
                </td>
              </tr>
            ) : (
              blocks.map((block) => (
                <tr key={block.id} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{block.blocker_name}</td>
                  <td className="px-4 py-3">{block.blocked_name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {formatAdminDate(block.created_at)}
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
