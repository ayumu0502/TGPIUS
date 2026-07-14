import type { Metadata } from "next";
import {
  adminDeleteExclusivePost,
  listExclusivePostsForAdmin,
} from "@/app/actions/admin-moderation";
import AdminConfirmForm from "@/components/admin/AdminConfirmForm";
import { formatAdminDate } from "@/lib/admin/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "限定コンテンツ管理",
  description: "TGPLUS 限定コンテンツ管理",
  path: "/admin/exclusive",
  noIndex: true,
});

export default async function AdminExclusivePage() {
  const posts = await listExclusivePostsForAdmin();

  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          限定コンテンツ管理
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">ファンクラブ限定投稿の管理</p>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="premium-card px-4 py-10 text-center text-[var(--text-muted)]">
            限定コンテンツがありません
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="premium-card flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{post.athlete_name}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {post.post_type} · {post.is_members_only ? "会員限定" : "公開"} ·{" "}
                  {formatAdminDate(post.created_at)}
                </p>
              </div>
              <AdminConfirmForm
                action={adminDeleteExclusivePost}
                confirmMessage="この限定コンテンツを削除しますか？"
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
