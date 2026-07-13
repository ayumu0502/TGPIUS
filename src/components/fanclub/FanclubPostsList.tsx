import { POST_TYPE_LABELS } from "@/lib/fanclub/constants";
import type { FanclubPost } from "@/types/fanclub";

export default function FanclubPostsList({
  posts,
  isMember,
}: {
  posts: FanclubPost[];
  isMember: boolean;
}) {
  if (posts.length === 0) {
    return (
      <div className="premium-card px-6 py-12 text-center">
        <p className="text-[var(--text-muted)]">
          {isMember
            ? "会員限定コンテンツはまだありません"
            : "加入すると会員限定コンテンツが閲覧できます"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {posts.map((post) => (
        <article key={post.id} className="premium-card p-5">
          <span className="rounded-full bg-[var(--gold)]/10 px-2.5 py-1 text-[10px] font-medium text-[var(--gold-dark)]">
            {POST_TYPE_LABELS[post.post_type]}
          </span>
          <h3 className="mt-3 font-semibold text-[var(--text-primary)]">{post.title}</h3>
          {post.content ? (
            <p className="mt-2 line-clamp-4 text-sm text-[var(--text-secondary)]">
              {post.content}
            </p>
          ) : null}
          {post.media_url ? (
            <a
              href={post.media_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-[var(--gold-dark)] hover:underline"
            >
              コンテンツを開く
            </a>
          ) : null}
          <p className="mt-3 text-[10px] text-[var(--text-muted)]">
            {new Date(post.created_at).toLocaleString("ja-JP")}
          </p>
        </article>
      ))}
    </div>
  );
}
