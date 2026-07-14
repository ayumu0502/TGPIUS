"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteMessage, updatePresence } from "@/app/actions/messages";
import MessageBubble from "@/components/messages/MessageBubble";
import MessageInput from "@/components/messages/MessageInput";
import ChatRoomActions from "@/components/messages/ChatRoomActions";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import {
  formatMessageDateDivider,
  isUserOnline,
} from "@/lib/messages/format";
import type { ChatMessage, ConversationSummary } from "@/types/messages";

type ChatRoomProps = {
  conversationId: string;
  initialMessages: ChatMessage[];
  otherUser: ConversationSummary["other_user"];
  currentUserId: string;
  variant?: "dark" | "light";
};

export default function ChatRoom({
  conversationId,
  initialMessages,
  otherUser,
  currentUserId,
  variant = "light",
}: ChatRoomProps) {
  const isLight = variant === "light";
  const [messages, setMessages] = useState(initialMessages);
  const [otherTyping, setOtherTyping] = useState(false);
  const [online, setOnline] = useState(otherUser.is_online);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    void updatePresence();
    const presenceInterval = setInterval(() => {
      void updatePresence();
    }, 30000);

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`room:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const newMsg: ChatMessage = {
            id: String(row.id),
            conversation_id: String(row.conversation_id),
            sender_id: String(row.sender_id),
            content: String(row.content ?? ""),
            message_type: row.message_type as ChatMessage["message_type"],
            file_url: row.file_url ? String(row.file_url) : null,
            file_name: row.file_name ? String(row.file_name) : null,
            file_mime: row.file_mime ? String(row.file_mime) : null,
            deleted_at: row.deleted_at ? String(row.deleted_at) : null,
            created_at: String(row.created_at),
            is_own: String(row.sender_id) === currentUserId,
            is_read: false,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === String(row.id)
                ? {
                    ...m,
                    deleted_at: row.deleted_at
                      ? String(row.deleted_at)
                      : m.deleted_at,
                    content: row.deleted_at ? "" : m.content,
                  }
                : m
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (String(row.user_id) === otherUser.user_id && row.typing_at) {
            const typingTime = new Date(String(row.typing_at)).getTime();
            setOtherTyping(Date.now() - typingTime < 5000);
          } else if (String(row.user_id) === otherUser.user_id) {
            setOtherTyping(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_reads",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const messageId = String(row.message_id);
          setMessages((prev) =>
            prev.map((m) =>
              m.is_own && m.id === messageId ? { ...m, is_read: true } : m
            )
          );
        }
      )
      .subscribe();

    const profileChannel = supabase
      .channel(`presence:${otherUser.user_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${otherUser.user_id}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setOnline(isUserOnline(row.last_seen_at ? String(row.last_seen_at) : null));
        }
      )
      .subscribe();

    return () => {
      clearInterval(presenceInterval);
      void supabase.removeChannel(channel);
      void supabase.removeChannel(profileChannel);
    };
  }, [conversationId, currentUserId, otherUser.user_id]);

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, deleted_at: new Date().toISOString(), content: "" }
          : m
      )
    );
  };

  let lastDate = "";

  return (
    <div className="flex h-full min-h-[calc(100dvh-7rem)] flex-col lg:min-h-[calc(100dvh-3.5rem)]">
      <div
        className={`flex items-center gap-3 border-b px-4 py-3 ${
          isLight
            ? "border-[var(--card-border)] bg-white"
            : "border-white/10"
        }`}
      >
        <ProfileAvatar
          name={otherUser.name}
          avatarUrl={otherUser.avatar_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${otherUser.user_id}`}
            className={`font-semibold hover:underline ${
              isLight ? "text-[var(--text-primary)]" : "text-white"
            }`}
          >
            {otherUser.name}
          </Link>
          <p
            className={`text-xs ${
              otherTyping
                ? isLight
                  ? "text-[var(--gold-dark)]"
                  : "text-zinc-300"
                : isLight
                  ? "text-[var(--text-muted)]"
                  : "text-zinc-500"
            }`}
          >
            {otherTyping
              ? "入力中..."
              : online
                ? "オンライン"
                : "オフライン"}
          </p>
        </div>
        <ChatRoomActions
          otherUserId={otherUser.user_id}
          otherUserName={otherUser.name}
          conversationId={conversationId}
          variant={variant}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((message) => {
          const dateKey = new Date(message.created_at).toDateString();
          const showDivider =
            dateKey !== lastDate
              ? formatMessageDateDivider(message.created_at)
              : undefined;
          lastDate = dateKey;

          return (
            <div key={message.id} className="group relative">
              <MessageBubble
                message={message}
                showDateDivider={showDivider}
                variant={variant}
              />
              {message.is_own && !message.deleted_at ? (
                <button
                  type="button"
                  onClick={() => handleDelete(message.id)}
                  className={`absolute right-2 top-0 hidden text-[10px] group-hover:block hover:text-red-400 ${
                    isLight ? "text-[var(--text-muted)]" : "text-zinc-600"
                  }`}
                >
                  削除
                </button>
              ) : null}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput conversationId={conversationId} variant={variant} />
    </div>
  );
}
