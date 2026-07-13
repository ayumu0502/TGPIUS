"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "アスリート応援", href: "/#support" },
  { label: "ポイントギフト", href: "/#gift" },
  { label: "企業スポンサー", href: "/#sponsor" },
  { label: "イベント", href: "/#events" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-black/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white text-sm font-black text-black transition-transform duration-300 group-hover:scale-105">
            T+
          </span>
          <span className="hidden sm:inline">TGPLUS</span>
        </Link>

        <ul className="hidden items-center gap-6 lg:flex xl:gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-zinc-400 transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:text-zinc-300"
          >
            ログイン
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10"
          >
            新規登録
          </Link>
        </div>

        <button
          type="button"
          aria-label="メニューを開く"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      <div
        className={`overflow-hidden border-b border-white/10 bg-black/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 px-6 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-4">
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-5 py-2.5 text-center text-sm font-medium"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-5 py-2.5 text-center text-sm font-semibold text-black"
            >
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
