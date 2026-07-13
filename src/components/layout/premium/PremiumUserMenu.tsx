"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/actions/auth";
import { ProfileAvatar } from "@/components/social/SocialLayout";

type PremiumUserMenuProps = {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
};

export default function PremiumUserMenu({ userId, userName, avatarUrl }: PremiumUserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-[var(--sidebar-hover)]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ProfileAvatar name={userName} avatarUrl={avatarUrl} size="sm" />
        <span className="hidden max-w-[100px] truncate text-sm text-[var(--text-primary)] sm:block">
          {userName}
        </span>
        <svg
          className={`hidden h-4 w-4 text-[var(--text-muted)] transition-transform sm:block ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--card-border)] bg-white py-1 shadow-lg"
        >
          <Link
            href={`/profile/${userId}`}
            role="menuitem"
            className="block px-4 py-2.5 text-sm text-[var(--text-primary)] transition hover:bg-[var(--sidebar-hover)]"
            onClick={() => setOpen(false)}
          >
            プロフィール
          </Link>
          <Link
            href="/points/purchase"
            role="menuitem"
            className="block px-4 py-2.5 text-sm text-[var(--text-primary)] transition hover:bg-[var(--sidebar-hover)]"
            onClick={() => setOpen(false)}
          >
            ポイント購入
          </Link>
          <div className="my-1 border-t border-[var(--card-border)]" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              ログアウト
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logout} className={className}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
        ログアウト
      </button>
    </form>
  );
}

export { LogoutButton };
