import Link from "next/link";
import PostCard from "@/components/social/PostCard";
import EmptyState from "@/components/ui/EmptyState";
import type { PostWithMeta } from "@/types/posts";

type PremiumFeedContentProps = {
  posts: PostWithMeta[];
  canCreatePost: boolean;
};

const FILTER_TABS = ["すべて", "フォロー中", "アスリート", "応援"];

export default function PremiumFeedContent({
  posts,
  canCreatePost,
}: PremiumFeedContentProps) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">フィード</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            アスリートやファンの最新投稿
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
            {posts.length}件の投稿
          </span>
          {canCreatePost ? (
            <Link href="/post/new" className="btn-gold rounded-full px-5 py-2.5 text-sm">
              投稿する
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              index === 0
                ? "btn-gold"
                : "border border-[var(--card-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--gold)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <EmptyState
          title="投稿がまだありません"
          description="最初の投稿を作成して、コミュニティを盛り上げましょう"
          action={
            canCreatePost ? (
              <Link href="/post/new" className="btn-gold inline-block rounded-full px-6 py-3 text-sm">
                投稿を作成
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="mx-auto max-w-2xl space-y-5">
          {posts.map((post) => (
            <div key={post.id} id={`post-${post.id}`} className="premium-card overflow-hidden">
              <PostCard post={post} variant="light" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
