"use client";

import { useEffect, useState, useTransition } from "react";
import { getPostComments } from "@/app/actions/posts";
import CommentForm from "@/components/social/CommentForm";
import {
  formatRelativeTime,
  ProfileAvatar,
} from "@/components/social/SocialLayout";
import type { Comment } from "@/types/posts";

type CommentSectionProps = {
  postId: string;
  variant?: "dark" | "light";
};

export default function CommentSection({
  postId,
  variant = "dark",
}: CommentSectionProps) {
  const isLight = variant === "light";
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const loadComments = () => {
    startTransition(async () => {
      const data = await getPostComments(postId);
      setComments(data);
      setLoaded(true);
    });
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  return (
    <div
      className={`mt-4 border-t pt-4 ${
        isLight ? "border-[var(--card-border)]" : "border-white/10"
      }`}
    >
      {!loaded ? (
        <p
          className={`mb-3 text-sm ${
            isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
          }`}
        >
          読み込み中...
        </p>
      ) : comments.length === 0 ? (
        <p
          className={`mb-3 text-sm ${
            isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
          }`}
        >
          最初のコメントを投稿しましょう
        </p>
      ) : (
        <ul className="mb-4 max-h-48 space-y-3 overflow-y-auto">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2">
              <ProfileAvatar name={comment.profile.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span
                    className={`font-semibold ${
                      isLight ? "text-[var(--text-primary)]" : "text-white"
                    }`}
                  >
                    {comment.profile.name}
                  </span>{" "}
                  <span
                    className={
                      isLight ? "text-[var(--text-secondary)]" : "text-zinc-300"
                    }
                  >
                    {comment.content}
                  </span>
                </p>
                <p
                  className={`mt-0.5 text-[10px] ${
                    isLight ? "text-[var(--text-muted)]" : "text-zinc-600"
                  }`}
                >
                  {formatRelativeTime(comment.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <CommentForm postId={postId} onSuccess={loadComments} variant={variant} />
    </div>
  );
}
