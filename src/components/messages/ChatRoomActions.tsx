"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockUser, reportUser } from "@/app/actions/messages";

type ChatRoomActionsProps = {
  otherUserId: string;
  otherUserName: string;
  conversationId: string;
  variant?: "dark" | "light";
};

export default function ChatRoomActions({
  otherUserId,
  otherUserName,
  conversationId,
  variant = "light",
}: ChatRoomActionsProps) {
  const isLight = variant === "light";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleBlock = () => {
    if (
      !window.confirm(
        `${otherUserName} をブロックしますか？今後メッセージの送受信ができなくなります。`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await blockUser(otherUserId);
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) {
        setOpen(false);
        router.push("/messages");
        router.refresh();
      }
    });
  };

  const handleReport = () => {
    const reason = window.prompt(
      `${otherUserName} を通報する理由を入力してください（5文字以上）`
    );
    if (!reason) return;

    startTransition(async () => {
      const result = await reportUser(otherUserId, reason, "dm", conversationId);
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) setOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`rounded-full px-2 py-1 text-lg leading-none ${
          isLight
            ? "text-[var(--text-muted)] hover:bg-[var(--surface)]"
            : "text-zinc-400 hover:bg-white/5"
        }`}
        aria-label="メニュー"
      >
        ⋮
      </button>

      {open ? (
        <div
          className={`absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border py-1 shadow-lg ${
            isLight
              ? "border-[var(--card-border)] bg-white"
              : "border-white/10 bg-zinc-900"
          }`}
        >
          <button
            type="button"
            disabled={isPending}
            onClick={handleReport}
            className={`block w-full px-4 py-2 text-left text-sm ${
              isLight
                ? "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                : "text-zinc-300 hover:bg-white/5"
            }`}
          >
            通報
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleBlock}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            ブロック
          </button>
        </div>
      ) : null}

      {feedback ? (
        <p
          className={`absolute right-0 top-full mt-1 whitespace-nowrap text-xs ${
            feedback.includes("失敗") || feedback.includes("入力")
              ? "text-red-500"
              : "text-emerald-600"
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
