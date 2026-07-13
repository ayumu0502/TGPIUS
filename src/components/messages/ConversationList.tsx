"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  getMessageableAthletes,
  searchMessages,
  startConversation,
} from "@/app/actions/messages";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import {
  formatMessageTime,
  isUserOnline,
  previewMessage,
} from "@/lib/messages/format";
import type { ConversationSummary, MessageSearchResult } from "@/types/messages";
import UnreadBadge from "@/components/messages/UnreadBadge";

type ConversationListProps = {
  conversations: ConversationSummary[];
  activeConversationId?: string;
  accountType: string;
  variant?: "dark" | "light";
};

export default function ConversationList({
  conversations,
  activeConversationId,
  accountType,
  variant = "light",
}: ConversationListProps) {
  const isLight = variant === "light";
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [athletes, setAthletes] = useState<
    { id: string; name: string; sport: string; avatar_url: string | null }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    startTransition(async () => {
      const results = await searchMessages(value);
      setSearchResults(results);
    });
  };

  const openNewChat = async () => {
    setShowNewChat(true);
    if (accountType === "fan" || accountType === "sponsor") {
      const list = await getMessageableAthletes();
      setAthletes(list);
    }
  };

  const handleStartChat = async (userId: string) => {
    const result = await startConversation(userId);
    if (result.conversationId) {
      setShowNewChat(false);
      router.push(`/messages/${result.conversationId}`);
    }
  };

  const isTyping = (conv: ConversationSummary) => {
    if (!conv.other_user.typing_at) return false;
    return Date.now() - new Date(conv.other_user.typing_at).getTime() < 5000;
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className={`border-b p-4 lg:border-0 ${
          isLight ? "border-[var(--card-border)]" : "border-white/10"
        }`}
      >
        <div className="hidden items-center justify-between lg:flex">
          <div>
            <h1
              className={`text-lg font-bold ${
                isLight ? "text-[var(--text-primary)]" : "text-white"
              }`}
            >
              メッセージ
            </h1>
            <p
              className={`text-xs ${
                isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
              }`}
            >
              DM
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <h1
            className={`text-lg font-bold ${
              isLight ? "text-[var(--text-primary)]" : "text-white"
            }`}
          >
            メッセージ
          </h1>
          {(accountType === "fan" || accountType === "sponsor") && (
            <button
              type="button"
              onClick={openNewChat}
              className={
                isLight
                  ? "btn-gold rounded-full px-3 py-1.5 text-xs"
                  : "rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black"
              }
            >
              新規
            </button>
          )}
        </div>
        <div className="relative mt-3 lg:mt-0">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="メッセージを検索"
            className={`w-full rounded-full border py-2.5 pl-4 pr-4 text-sm focus:outline-none ${
              isLight
                ? "border-[var(--card-border)] bg-zinc-50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)]"
                : "border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:border-white/30"
            }`}
          />
        </div>
        {(accountType === "fan" || accountType === "sponsor") && (
          <button
            type="button"
            onClick={openNewChat}
            className={`mt-3 hidden w-full rounded-xl py-2.5 text-sm font-medium transition-colors lg:block ${
              isLight
                ? "border border-[var(--card-border)] bg-zinc-50 text-[var(--text-primary)] hover:border-[var(--gold)]"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            ＋ 新しいメッセージ
          </button>
        )}
      </div>

      {showNewChat ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <p
              className={`text-sm font-semibold ${
                isLight ? "text-[var(--text-primary)]" : "text-white"
              }`}
            >
              アスリートを選択
            </p>
            <button
              type="button"
              onClick={() => setShowNewChat(false)}
              className={`text-xs ${
                isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
              }`}
            >
              閉じる
            </button>
          </div>
          <div className="space-y-2">
            {athletes.map((athlete) => (
              <button
                key={athlete.id}
                type="button"
                onClick={() => handleStartChat(athlete.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  isLight
                    ? "border-[var(--card-border)] bg-zinc-50 hover:border-[var(--gold)]"
                    : "border-white/10 bg-black/40 hover:bg-white/5"
                }`}
              >
                <ProfileAvatar
                  name={athlete.name}
                  avatarUrl={athlete.avatar_url}
                  size="sm"
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isLight ? "text-[var(--text-primary)]" : "text-white"
                    }`}
                  >
                    {athlete.name}
                  </p>
                  <p
                    className={`text-xs ${
                      isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
                    }`}
                  >
                    {athlete.sport || "競技未設定"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : searchQuery.trim() ? (
        <div className="flex-1 overflow-y-auto">
          {isPending ? (
            <p
              className={`p-4 text-sm ${
                isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
              }`}
            >
              検索中...
            </p>
          ) : searchResults.length === 0 ? (
            <p
              className={`p-4 text-sm ${
                isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
              }`}
            >
              結果がありません
            </p>
          ) : (
            searchResults.map((result) => (
              <Link
                key={result.message.id}
                href={`/messages/${result.conversation_id}`}
                className={`block border-b px-4 py-3 transition-colors ${
                  isLight
                    ? "border-[var(--card-border)] hover:bg-zinc-50"
                    : "border-white/5 hover:bg-white/5"
                }`}
              >
                <p
                  className={`text-xs ${
                    isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
                  }`}
                >
                  {result.other_user_name}
                </p>
                <p
                  className={`mt-1 truncate text-sm ${
                    isLight ? "text-[var(--text-primary)]" : "text-zinc-200"
                  }`}
                >
                  {result.message.content}
                </p>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p
                className={`text-sm ${
                  isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
                }`}
              >
                会話がありません
              </p>
              {(accountType === "fan" || accountType === "sponsor") && (
                <button
                  type="button"
                  onClick={openNewChat}
                  className={
                    isLight
                      ? "btn-gold mt-4 rounded-full px-5 py-2 text-sm"
                      : "mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
                  }
                >
                  メッセージを始める
                </button>
              )}
            </div>
          ) : (
            conversations.map((conv) => {
              const active = conv.id === activeConversationId;
              const typing = isTyping(conv);
              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className={`flex items-center gap-3 border-b px-4 py-3 transition-colors ${
                    isLight
                      ? `border-[var(--card-border)] hover:bg-zinc-50 ${
                          active ? "border-l-[3px] border-l-[var(--gold)] bg-[var(--gold)]/5" : ""
                        }`
                      : `border-white/5 hover:bg-white/5 ${active ? "bg-white/10" : ""}`
                  }`}
                >
                  <div className="relative">
                    <ProfileAvatar
                      name={conv.other_user.name}
                      avatarUrl={conv.other_user.avatar_url}
                      size="md"
                    />
                    {conv.other_user.is_online ? (
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 bg-green-400 ${
                          isLight ? "border-white" : "border-black"
                        }`}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate font-semibold ${
                          isLight ? "text-[var(--text-primary)]" : "text-white"
                        }`}
                      >
                        {conv.other_user.name}
                      </p>
                      {conv.last_message ? (
                        <span
                          className={`shrink-0 text-[10px] ${
                            isLight ? "text-[var(--text-muted)]" : "text-zinc-500"
                          }`}
                        >
                          {formatMessageTime(conv.last_message.created_at)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          typing
                            ? isLight
                              ? "text-[var(--gold-dark)]"
                              : "text-zinc-300"
                            : isLight
                              ? "text-[var(--text-muted)]"
                              : "text-zinc-500"
                        }`}
                      >
                        {typing
                          ? "入力中..."
                          : conv.last_message
                            ? previewMessage(
                                conv.last_message.content,
                                conv.last_message.message_type,
                                !!conv.last_message.deleted_at
                              )
                            : "会話を始めましょう"}
                      </p>
                      <UnreadBadge count={conv.unread_count} />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
