import type { Metadata } from "next";
import { adminDeleteComment, listCommentsForAdmin } from "@/app/actions/admin-moderation";
import AdminConfirmForm from "@/components/admin/AdminConfirmForm";
import { formatAdminDate } from "@/lib/admin/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "コメント管理",
  description: "TGPLUS コメント管理",
  path: "/admin/comments",
  noIndex: true,
});

type AdminCommentsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminCommentsPage({ searchParams }: AdminCommentsPageProps) {
  const { q } = await searchParams;
  const comments = await listCommentsForAdmin(q);

  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          コメント管理
        </h2>
        <form method="get" className="mt-4 flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="コメント内容で検索"
            className="flex-1 rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm"
          />
          <button type="submit" className="btn-gold rounded-full px-5 py-2.5 text-sm">
            検索
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="premium-card px-4 py-10 text-center text-[var(--text-muted)]">
            コメントがありません
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="premium-card flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{comment.user_name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{comment.content}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  投稿ID: {comment.post_id.slice(0, 8)}… · {formatAdminDate(comment.created_at)}
                </p>
              </div>
              <AdminConfirmForm
                action={adminDeleteComment}
                confirmMessage="このコメントを削除しますか？"
                hiddenFields={{ comment_id: comment.id }}
                buttonLabel="削除"
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}
