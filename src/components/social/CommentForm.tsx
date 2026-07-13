"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/actions/posts";

type CommentFormProps = {
  postId: string;
  onSuccess?: () => void;
  variant?: "dark" | "light";
};

export default function CommentForm({
  postId,
  onSuccess,
  variant = "dark",
}: CommentFormProps) {
  const isLight = variant === "light";
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(addComment, null);

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
      onSuccess?.();
      router.refresh();
    }
  }, [state, router, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <input type="hidden" name="postId" value={postId} />
      <input
        name="content"
        type="text"
        placeholder="コメントを追加..."
        maxLength={500}
        required
        className={`flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none ${
          isLight
            ? "border-[var(--card-border)] bg-zinc-50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)]"
            : "border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:border-white/30"
        }`}
      />
      <button
        type="submit"
        disabled={isPending}
        className={`shrink-0 text-sm font-semibold disabled:opacity-40 ${
          isLight ? "text-[var(--gold-dark)]" : "text-white disabled:text-zinc-600"
        }`}
      >
        {isPending ? "..." : "投稿"}
      </button>
      {state?.error ? (
        <p className="absolute mt-10 text-xs text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}
