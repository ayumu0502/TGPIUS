import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import PageEnter from "@/components/ui/PageEnter";
import AppFooter from "@/components/layout/AppFooter";
import { AuthLogo } from "@/components/auth/AuthBackground";
import BackButton from "@/components/ui/BackButton";
import { getDashboardPath } from "@/lib/auth/routes";
import type { AccountType } from "@/types/auth";

type AdminDashboardLayoutProps = {
  name: string;
  email: string;
  accountType: AccountType;
  children: ReactNode;
};

export default function AdminDashboardLayout({
  name,
  email,
  accountType,
  children,
}: AdminDashboardLayoutProps) {
  const userAppHref = getDashboardPath(accountType);

  return (
    <div className="premium-app relative flex min-h-screen flex-col bg-[#f7f8fa]">
      <header className="premium-shell-header sticky top-0 z-10 border-b border-[#e8eaed] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BackButton />
            <AuthLogo theme="light" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href={userAppHref}
              className="rounded-full border border-[var(--gold)] px-4 py-2 text-xs font-medium text-[var(--gold-dark)] transition-colors duration-200 hover:bg-[rgba(197,160,89,0.1)] sm:px-5 sm:py-2.5 sm:text-sm"
            >
              一般画面へ戻る
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
              <p className="text-xs text-[var(--text-muted)]">管理者</p>
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
        <PageEnter>
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-2 sm:mb-10">
            <p className="text-sm font-medium text-[var(--text-muted)]">管理者ダッシュボード</p>
            <h1 className="ja-heading text-2xl font-bold text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
              管理コンソール
            </h1>
            <p className="ja-body text-sm text-[var(--text-muted)]">
              {name} · {email}
            </p>
          </div>
          {children}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={userAppHref}
              className="btn-gold rounded-full px-6 py-2.5 text-sm font-medium"
            >
              一般画面へ戻る
            </Link>
            <Link
              href="/"
              className="text-sm text-[var(--text-muted)] underline-offset-4 transition-colors hover:text-[var(--gold-dark)] hover:underline"
            >
              トップページ
            </Link>
          </div>
        </div>
        </PageEnter>
      </main>
      <AppFooter />
    </div>
  );
}
