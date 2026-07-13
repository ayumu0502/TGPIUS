import {
  formatMessageDateDivider,
  formatMessageTime,
} from "@/lib/messages/format";
import type { ChatMessage } from "@/types/messages";

type MessageBubbleProps = {
  message: ChatMessage;
  showDateDivider?: string;
  variant?: "dark" | "light";
};

export default function MessageBubble({
  message,
  showDateDivider,
  variant = "light",
}: MessageBubbleProps) {
  const isLight = variant === "light";
  const isDeleted = !!message.deleted_at;
  const isOwn = message.is_own;

  return (
    <>
      {showDateDivider ? (
        <div className="my-4 flex justify-center">
          <span
            className={`rounded-full px-3 py-1 text-[10px] ${
              isLight
                ? "bg-zinc-200 text-[var(--text-muted)]"
                : "bg-white/10 text-zinc-400"
            }`}
          >
            {showDateDivider}
          </span>
        </div>
      ) : null}
      <div className={`mb-2 flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
            isOwn
              ? isLight
                ? "rounded-br-md bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] text-white"
                : "rounded-br-md bg-white text-black"
              : isLight
                ? "rounded-bl-md border border-[var(--card-border)] bg-white text-[var(--text-primary)] shadow-sm"
                : "rounded-bl-md border border-white/10 bg-zinc-900 text-white"
          } ${isDeleted ? "opacity-60" : ""}`}
        >
          {isDeleted ? (
            <p
              className={`text-sm italic ${
                isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
              }`}
            >
              メッセージが削除されました
            </p>
          ) : message.message_type === "image" && message.file_url ? (
            <a href={message.file_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.file_url}
                alt=""
                className="max-h-64 rounded-lg object-cover"
              />
              {message.content && message.content !== "画像" ? (
                <p className="ja-body mt-2 text-sm">{message.content}</p>
              ) : null}
            </a>
          ) : message.message_type === "file" && message.file_url ? (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-sm underline-offset-2 hover:underline ${
                isOwn
                  ? isLight
                    ? "text-white"
                    : "text-black"
                  : isLight
                    ? "text-[var(--text-primary)]"
                    : "text-white"
              }`}
            >
              <span>📎</span>
              <span>{message.file_name || "ファイル"}</span>
            </a>
          ) : (
            <p className="ja-body whitespace-pre-wrap text-sm">
              {message.content}
            </p>
          )}
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              isOwn
                ? isLight
                  ? "text-white/70"
                  : "text-zinc-600"
                : isLight
                  ? "text-[var(--text-muted)]"
                  : "text-zinc-500"
            }`}
          >
            <span>{formatMessageTime(message.created_at)}</span>
            {isOwn && !isDeleted ? (
              <span>{message.is_read ? "既読" : "未読"}</span>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
