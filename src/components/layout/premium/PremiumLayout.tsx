"use client";

import PageEnter from "@/components/ui/PageEnter";
import Link from "next/link";
import { useState } from "react";
import { NavIcon, IconBell, IconSearch, IconMenu, IconClose } from "@/components/layout/premium/PremiumIcons";
import PremiumUserMenu, { LogoutButton } from "@/components/layout/premium/PremiumUserMenu";
import AppFooter from "@/components/layout/AppFooter";
import BackButton from "@/components/ui/BackButton";
import {
  filterNavForRole,
  getDashboardPath,
  SIDEBAR_NAV_ITEMS,
  TOP_NAV_ITEMS,
  type PremiumNavId,
} from "@/lib/ui/nav";
import { formatPoints } from "@/lib/points/constants";
import type { AccountType } from "@/types/auth";

type PremiumLayoutProps = {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  currentUser: {
    id: string;
    name: string;
    accountType: AccountType;
    avatarUrl?: string | null;
    isAdmin?: boolean;
  };
  activeNav?: PremiumNavId;
  pointBalance?: number;
  notificationCount?: number;
  messageUnreadCount?: number;
  /** @deprecated use notificationCount + messageUnreadCount */
  unreadCount?: number;
};

function resolveHref(item: { href: string; id: PremiumNavId }, userId: string, accountType: AccountType) {
  if (item.id === "profile") return `/profile/${userId}`;
  if (item.id === "dashboard") return getDashboardPath(accountType);
  return item.href;
}

export default function PremiumLayout({
  children,
  rightSidebar,
  currentUser,
  activeNav = "dashboard",
  pointBalance,
  notificationCount: notificationCountProp,
  messageUnreadCount: messageUnreadCountProp,
  unreadCount = 0,
}: PremiumLayoutProps) {
  const notificationCount = notificationCountProp ?? unreadCount;
  const messageUnreadCount = messageUnreadCountProp ?? 0;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = currentUser.isAdmin === true;
  const sidebarItems = filterNavForRole(
    SIDEBAR_NAV_ITEMS,
    currentUser.accountType,
    isAdmin
  );
  const topItems = filterNavForRole(TOP_NAV_ITEMS, currentUser.accountType, isAdmin);

  const sections = [...new Set(sidebarItems.map((i) => i.section).filter(Boolean))];

  return (
    <div className="premium-app flex min-h-screen bg-[#f7f8fa]">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="メニューを閉じる"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`premium-shell-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#e8eaed] bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] text-sm font-bold text-white">
              T
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">TGPLUS</p>
              <p className="text-[10px] text-[var(--text-muted)]">アスリートを応援する</p>
            </div>
          </Link>
          <button
            type="button"
            className="text-[var(--text-muted)] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="閉じる"
          >
            <IconClose />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--gold-dark)]">
                {section}
              </p>
              <ul className="space-y-0.5">
                {sidebarItems
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const href = resolveHref(item, currentUser.id, currentUser.accountType);
                    const isActive = activeNav === item.id;
                    return (
                      <li key={item.id}>
                        <Link
                          href={href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? "sidebar-active font-medium"
                              : "text-[var(--text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                          {item.id === "messages" && messageUnreadCount > 0 ? (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                              {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                            </span>
                          ) : null}
                          {item.id === "notifications" && notificationCount > 0 ? (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-bold text-white">
                              {notificationCount > 99 ? "99+" : notificationCount}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        {isAdmin ? (
          <div className="border-t border-[var(--card-border)] px-3 py-3">
            <Link
              href="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg border border-[rgba(197,160,89,0.35)] bg-[rgba(197,160,89,0.08)] px-3 py-2.5 text-sm font-medium text-[var(--gold-dark)] transition-colors hover:bg-[rgba(197,160,89,0.14)]"
            >
              <NavIcon name="user" className="h-5 w-5 shrink-0" />
              <span>管理画面</span>
            </Link>
          </div>
        ) : null}

        <div className="border-t border-[var(--card-border)] p-4">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--sidebar-hover)] p-4">
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              選手を応援して、限定コンテンツを楽しもう
            </p>
            <Link
              href="/points/purchase"
              onClick={() => setSidebarOpen(false)}
              className="btn-gold mt-3 block rounded-lg py-2.5 text-center text-xs"
            >
              ポイント購入
            </Link>
          </div>
          <div className="mt-3" onClick={() => setSidebarOpen(false)}>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="premium-shell-header sticky top-0 z-30 border-b border-[#e8eaed] bg-white/95 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-4 sm:gap-3 lg:px-6">
            <BackButton showLabel />
            <button
              type="button"
              className="text-[var(--text-muted)] lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="メニュー"
            >
              <IconMenu />
            </button>

            <nav className="hidden flex-1 items-center gap-1 md:flex">
              {topItems.map((item) => {
                const href = resolveHref(item, currentUser.id, currentUser.accountType);
                const isActive = activeNav === item.id;
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`px-4 py-4 text-sm transition-colors ${
                      isActive
                        ? "topnav-active font-medium"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAdmin ? (
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-4 text-sm font-medium text-[var(--gold-dark)] transition-colors hover:text-[var(--gold)]"
                >
                  管理画面
                </Link>
              ) : null}
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Link
                href="/search"
                className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--gold-dark)]"
                aria-label="検索"
              >
                <IconSearch className="h-5 w-5" />
              </Link>

              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--gold-dark)]"
                aria-label="通知"
              >
                <IconBell className="h-5 w-5" />
                {notificationCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold)] px-0.5 text-[9px] font-bold text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/messages"
                className="relative hidden rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--gold-dark)] sm:block"
                aria-label="メッセージ"
              >
                <NavIcon name="message" className="h-5 w-5" />
                {messageUnreadCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                    {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
                  </span>
                ) : null}
              </Link>

              {pointBalance !== undefined ? (
                <Link
                  href="/points/purchase"
                  className="btn-gold flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] sm:px-3 sm:text-xs"
                >
                  <NavIcon name="coin" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="max-w-[72px] truncate sm:max-w-none">
                    {formatPoints(pointBalance)}
                  </span>
                </Link>
              ) : null}

              <PremiumUserMenu
                userId={currentUser.id}
                userName={currentUser.name}
                avatarUrl={currentUser.avatarUrl}
              />
            </div>
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <main className="premium-shell-main premium-content min-w-0 flex-1 overflow-y-auto">
              <PageEnter>{children}</PageEnter>
            </main>

            {rightSidebar ? (
              <aside className="premium-shell-main premium-content hidden w-80 shrink-0 overflow-y-auto border-l border-[#e8eaed] p-5 xl:block">
                {rightSidebar}
              </aside>
            ) : null}
          </div>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
