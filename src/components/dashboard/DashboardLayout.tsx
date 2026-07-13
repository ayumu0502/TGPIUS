import Link from "next/link";
import { logout } from "@/app/actions/auth";
import AppFooter from "@/components/layout/AppFooter";
import { AuthLogo } from "@/components/auth/AuthBackground";
import type { AccountType } from "@/types/auth";
import type { ReactNode } from "react";

const roleLabels: Record<AccountType, string> = {
  fan: "ファン",
  athlete: "アスリート",
  sponsor: "企業スポンサー",
};

type DashboardLayoutProps = {
  accountType: AccountType;
  name: string;
  email: string;
  children: ReactNode;
};

export default function DashboardLayout({
  accountType,
  name,
  email,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="premium-app relative flex min-h-screen flex-col bg-[#f7f8fa]">
      <header className="premium-shell-header sticky top-0 z-10 border-b border-[#e8eaed] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <AuthLogo theme="light" />
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/feed"
              className="hidden text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--gold-dark)] sm:inline"
            >
              フィード
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
              <p className="text-xs text-[var(--text-muted)]">{roleLabels[accountType]}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-[var(--card-border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--gold)] hover:text-[var(--gold-dark)] sm:px-5 sm:py-2.5 sm:text-sm"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="premium-content relative z-10 flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-2 sm:mb-10">
            <p className="text-sm font-medium text-[var(--text-muted)]">
              {roleLabels[accountType]}ダッシュボード
            </p>
            <h1 className="ja-heading text-2xl font-bold text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
              ようこそ、{name}さん
            </h1>
            <p className="ja-body text-sm text-[var(--text-muted)]">{email}</p>
          </div>
          {children}
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="text-sm text-[var(--text-muted)] underline-offset-4 transition-colors hover:text-[var(--gold-dark)] hover:underline"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
