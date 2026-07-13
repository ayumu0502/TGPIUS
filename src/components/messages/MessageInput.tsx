"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage, setTyping } from "@/app/actions/messages";

type MessageInputProps = {
  conversationId: string;
  variant?: "dark" | "light";
};

export default function MessageInput({
  conversationId,
  variant = "light",
}: MessageInputProps) {
  const isLight = variant === "light";
  const formRef = useRef<HTMLFormElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, formAction, isPending] = useActionState(sendMessage, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  const handleTyping = () => {
    void setTyping(conversationId, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      void setTyping(conversationId, false);
    }, 2000);
  };

  return (
    <div
      className={`border-t p-3 sm:p-4 ${
        isLight
          ? "border-[var(--card-border)] bg-white"
          : "border-white/10 bg-black/80 backdrop-blur-xl"
      }`}
    >
      {state?.error ? (
        <p className="mb-2 text-xs text-red-400">{state.error}</p>
      ) : null}
      <form ref={formRef} action={formAction} className="flex items-end gap-2">
        <input type="hidden" name="conversation_id" value={conversationId} />
        <label
          className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
            isLight
              ? "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--gold)]"
              : "border-white/10 text-zinc-400 hover:bg-white/5"
          }`}
        >
          <span className="text-lg">＋</span>
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
        <textarea
          name="content"
          rows={1}
          placeholder="メッセージを入力..."
          onInput={handleTyping}
          className={`ja-body max-h-32 flex-1 resize-none rounded-2xl border px-4 py-2.5 text-sm focus:outline-none ${
            isLight
              ? "border-[var(--card-border)] bg-zinc-50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)]"
              : "border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:border-white/30"
          }`}
        />
        <button
          type="submit"
          disabled={isPending}
          className={
            isLight
              ? "btn-gold shrink-0 rounded-full px-4 py-2.5 text-sm disabled:opacity-40"
              : "shrink-0 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
          }
        >
          送信
        </button>
      </form>
    </div>
  );
}
