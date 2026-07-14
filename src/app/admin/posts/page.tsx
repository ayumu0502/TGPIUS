import type { Metadata } from "next";
import { adminDeletePost, listPostsForAdmin } from "@/app/actions/admin-moderation";
import AdminConfirmForm from "@/components/admin/AdminConfirmForm";
import { formatAdminDate } from "@/lib/admin/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "投稿管理",
  description: "TGPLUS 投稿管理",
  path: "/admin/posts",
  noIndex: true,
});

type AdminPostsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const { q } = await searchParams;
  const posts = await listPostsForAdmin(q);

  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          投稿管理
        </h2>
        <form method="get" className="mt-4 flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="キャプションで検索"
            className="flex-1 rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm"
          />
          <button type="submit" className="btn-gold rounded-full px-5 py-2.5 text-sm">
            検索
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="premium-card px-4 py-10 text-center text-[var(--text-muted)]">
            投稿がありません
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="premium-card flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--text-primary)]">{post.user_name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{post.caption || "（キャプションなし）"}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {post.media_type} · {formatAdminDate(post.created_at)}
                </p>
              </div>
              <AdminConfirmForm
                action={adminDeletePost}
                confirmMessage="この投稿を削除しますか？この操作は取り消せません。"
                hiddenFields={{ post_id: post.id }}
                buttonLabel="削除"
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}
