"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleLike } from "@/app/actions/posts";
import CommentSection from "@/components/social/CommentSection";
import {
  AccountBadge,
  formatRelativeTime,
  ProfileAvatar,
} from "@/components/social/SocialLayout";
import type { PostWithMeta } from "@/types/posts";

type PostCardProps = {
  post: PostWithMeta;
  showCommentsDefault?: boolean;
  variant?: "dark" | "light";
  showShare?: boolean;
  showSave?: boolean;
};

function getSavedPostIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("tgplus_saved_posts") ?? "[]") as string[];
  } catch {
    return [];
  }
}

export default function PostCard({
  post,
  showCommentsDefault = false,
  variant = "light",
  showShare = false,
  showSave = false,
}: PostCardProps) {
  const isLight = variant === "light";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(showCommentsDefault);
  const [saved, setSaved] = useState(
    () => typeof window !== "undefined" && getSavedPostIds().includes(post.id)
  );
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const handleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => count + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleLike(post.id);
      if (result.error) {
        setLiked(!nextLiked);
        setLikeCount((count) => count + (nextLiked ? -1 : 1));
      } else {
        router.refresh();
      }
    });
  };

  const handleSave = () => {
    const ids = getSavedPostIds();
    const nextSaved = !saved;
    const nextIds = nextSaved
      ? [...new Set([...ids, post.id])]
      : ids.filter((id) => id !== post.id);
    localStorage.setItem("tgplus_saved_posts", JSON.stringify(nextIds));
    setSaved(nextSaved);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.profile.name}の投稿`,
          text: post.caption || undefined,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("リンクをコピーしました");
        setTimeout(() => setShareMessage(null), 2000);
      }
    } catch {
      setShareMessage(null);
    }
  };

  const iconClass = isLight ? "text-[var(--text-secondary)]" : "text-white";

  return (
    <article className={isLight ? "bg-white" : "border-b border-white/10 bg-black"}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/profile/${post.user_id}`}>
          <ProfileAvatar name={post.profile.name} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${post.user_id}`}
            className={`text-sm font-semibold hover:underline ${
              isLight ? "text-[var(--text-primary)]" : "text-white"
            }`}
          >
            {post.profile.name}
          </Link>
          <div className="mt-0.5 flex items-center gap-2">
            <AccountBadge accountType={post.profile.account_type} />
            <span
              className={`text-xs ${
                isLight ? "text-[var(--text-muted)]" : "text-zinc-600"
              }`}
            >
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`relative aspect-square w-full ${
          isLight ? "bg-zinc-100" : "bg-zinc-950"
        }`}
      >
        {post.media_type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.media_url}
            alt={post.caption || "投稿画像"}
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            src={post.media_url}
            controls
            playsInline
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={isPending}
            aria-label={liked ? "いいねを解除" : "いいね"}
            className="transition-transform duration-200 hover:scale-110 disabled:opacity-50"
          >
            {liked ? (
              <svg
                className={`h-7 w-7 ${isLight ? "text-[var(--gold-dark)]" : "text-white"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg
                className={`h-7 w-7 ${isLight ? "text-[var(--text-secondary)]" : "text-white"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowComments((value) => !value)}
            aria-label="コメント"
            className="transition-transform duration-200 hover:scale-110"
          >
            <svg
              className={`h-7 w-7 ${iconClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.488l-1.078 3.593a.75.75 0 00.92.92l3.593-1.078A8.962 8.962 0 0012 20.25z" />
            </svg>
          </button>

          {showShare ? (
            <button
              type="button"
              onClick={handleShare}
              aria-label="シェア"
              className="transition-transform duration-200 hover:scale-110"
            >
              <svg
                className={`h-7 w-7 ${iconClass}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
                />
              </svg>
            </button>
          ) : null}

          {showSave ? (
            <button
              type="button"
              onClick={handleSave}
              aria-label={saved ? "保存を解除" : "保存"}
              className="ml-auto transition-transform duration-200 hover:scale-110"
            >
              <svg
                className={`h-7 w-7 ${
                  saved
                    ? isLight
                      ? "text-[var(--gold-dark)]"
                      : "text-[var(--gold-light)]"
                    : iconClass
                }`}
                viewBox="0 0 24 24"
                fill={saved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
            </button>
          ) : null}
        </div>

        {shareMessage ? (
          <p className="mt-1 text-xs text-[var(--gold-dark)]">{shareMessage}</p>
        ) : null}

        {likeCount > 0 ? (
          <p
            className={`mt-2 text-sm font-semibold ${
              isLight ? "text-[var(--text-primary)]" : "text-white"
            }`}
          >
            いいね {likeCount.toLocaleString()}件
          </p>
        ) : null}

        {post.caption ? (
          <p
            className={`ja-body mt-2 text-sm ${
              isLight ? "text-[var(--text-secondary)]" : "text-zinc-200"
            }`}
          >
            <Link
              href={`/profile/${post.user_id}`}
              className={`mr-2 font-semibold hover:underline ${
                isLight ? "text-[var(--text-primary)]" : "text-white"
              }`}
            >
              {post.profile.name}
            </Link>
            {post.caption}
          </p>
        ) : null}

        {post.comment_count > 0 && !showComments ? (
          <button
            type="button"
            onClick={() => setShowComments(true)}
            className={`mt-2 text-sm ${
              isLight
                ? "text-[var(--text-muted)] hover:text-[var(--gold-dark)]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            コメント{post.comment_count}件をすべて見る
          </button>
        ) : null}

        {showComments ? (
          <CommentSection postId={post.id} variant={variant} />
        ) : null}

        <p
          className={`mt-3 text-xs ${
            isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
          }`}
        >
          {new Date(post.created_at).toLocaleString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </article>
  );
}
