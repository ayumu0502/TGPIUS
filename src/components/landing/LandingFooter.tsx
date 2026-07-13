import Link from "next/link";
import LegalFooterLinks from "@/components/legal/LegalFooterLinks";

const footerLinks = [
  { href: "#features", label: "機能" },
  { href: "#athletes", label: "アスリート" },
  { href: "#ranking", label: "ランキング" },
  { href: "#gifts", label: "ギフト" },
  { href: "#events", label: "イベント" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div>
            <p className="text-xl font-bold tracking-[0.2em] text-[var(--landing-text)]">TGPLUS</p>
            <p className="ja-body mt-4 max-w-sm text-sm text-[var(--landing-muted)]">
              アスリート、ファン、企業がつながる
              プレミアムスポーツサポートプラットフォーム。
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--landing-muted)] transition hover:text-[var(--landing-gold-dark)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-[var(--landing-border)] pt-8">
          <LegalFooterLinks
            linkClassName="text-sm text-[var(--landing-muted)] transition hover:text-[var(--landing-gold-dark)]"
          />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--landing-border)] pt-8 sm:flex-row">
          <p className="text-xs text-[var(--landing-muted)]">
            &copy; {new Date().getFullYear()} TGPLUS. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-xs text-[var(--landing-muted)] hover:text-[var(--landing-text)]">
              ログイン
            </Link>
            <Link href="/register" className="text-xs text-[var(--landing-muted)] hover:text-[var(--landing-text)]">
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
