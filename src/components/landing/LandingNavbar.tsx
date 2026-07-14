"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#athletes", label: "アスリートを探す" },
  { href: "#events", label: "イベント" },
  { href: "#gifts", label: "ギフト" },
  { href: "#sponsors", label: "スポンサー" },
  { href: "#ranking", label: "ランキング" },
  { href: "#features", label: "TGPLUSとは" },
  { href: "#contact", label: "お問い合わせ" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`landing-nav ${scrolled ? "is-scrolled" : "is-light"}`}>
      <div className="landing-nav__inner">
        <Link href="/" className="landing-nav-brand">
          <span className="landing-nav-logo">
            <span className="landing-nav-logo-tg">TG</span>
            <span className="landing-nav-logo-plus">PLUS</span>
          </span>
          <span className="landing-nav-tagline">Premium Sports Support Platform</span>
        </Link>

        <nav className="landing-nav__links">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="landing-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-nav__actions">
          <Link href="/login" className="landing-btn-login">
            ログイン
          </Link>
          <Link href="/register" className="landing-btn-primary landing-btn-primary--sm">
            新規登録
          </Link>
        </div>

        <button
          type="button"
          className="landing-nav__menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="メニュー"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="landing-nav__mobile">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base font-medium text-[var(--landing-text)]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--landing-border)] pt-4">
              <Link href="/login" className="landing-btn-login text-center">
                ログイン
              </Link>
              <Link href="/register" className="landing-btn-primary text-center">
                新規登録
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
