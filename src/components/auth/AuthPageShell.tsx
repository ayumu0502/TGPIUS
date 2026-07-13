import Link from "next/link";
import type { ReactNode } from "react";
import LegalFooterLinks from "@/components/legal/LegalFooterLinks";
import { AuthLogo } from "@/components/auth/AuthBackground";

type AuthPageShellProps = {
  children: ReactNode;
  headerAction: ReactNode;
};

export default function AuthPageShell({ children, headerAction }: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--content-bg)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(197,160,89,0.12), transparent), repeating-linear-gradient(-35deg, transparent, transparent 80px, rgba(197,160,89,0.03) 80px, rgba(197,160,89,0.03) 81px)",
        }}
      />

      <header className="relative z-10 border-b border-[var(--card-border)] bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <AuthLogo theme="light" />
          {headerAction}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        {children}
      </main>

      <footer className="relative z-10 border-t border-[var(--card-border)] bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LegalFooterLinks linkClassName="text-xs text-[var(--text-muted)] transition hover:text-[var(--gold-dark)]" />
          <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--gold-dark)]">
            トップへ戻る
          </Link>
        </div>
      </footer>
    </div>
  );
}
