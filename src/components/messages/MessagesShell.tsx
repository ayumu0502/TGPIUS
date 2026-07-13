import Link from "next/link";
import { logout } from "@/app/actions/auth";
import AuthBackground, { AuthLogo } from "@/components/auth/AuthBackground";
import UnreadBadge from "@/components/messages/UnreadBadge";
import type { ReactNode } from "react";

type MessagesShellProps = {
  children: ReactNode;
  sidebar: ReactNode;
  activeConversationId?: string;
  unreadCount: number;
};

export default function MessagesShell({
  children,
  sidebar,
  activeConversationId,
  unreadCount,
}: MessagesShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      <AuthBackground />

      <header className="relative z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {activeConversationId ? (
            <Link
              href="/messages"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              ← 一覧
            </Link>
          ) : (
            <AuthLogo />
          )}
          <div className="flex items-center gap-3">
            <Link
              href="/feed"
              className="text-xs text-zinc-500 transition-colors hover:text-white"
            >
              フィード
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 overflow-hidden">
        <aside
          className={`flex w-full flex-col border-white/10 bg-black/60 lg:w-96 lg:shrink-0 lg:border-r ${
            activeConversationId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="hidden border-b border-white/10 px-4 py-4 lg:block">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">メッセージ</h1>
                <p className="text-xs text-zinc-500">DM</p>
              </div>
              <UnreadBadge count={unreadCount} />
            </div>
          </div>
          {sidebar}
        </aside>

        <main
          className={`flex min-h-[calc(100vh-56px)] flex-1 flex-col bg-black/40 lg:min-h-screen ${
            activeConversationId ? "flex" : "hidden lg:flex"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
