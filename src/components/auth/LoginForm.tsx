"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthInput, { AuthAlert } from "@/components/auth/AuthInput";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";
  const isSuspended = searchParams.get("suspended") === "1";
  const resetSuccess = searchParams.get("reset") === "success";
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <AuthPageShell
      headerAction={
        <Link href="/register" className="btn-gold rounded-full px-5 py-2.5 text-sm">
          新規登録
        </Link>
      }
    >
      <div className="w-full max-w-md">
        <div className="premium-card animate-fade-in-up p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="ja-heading text-3xl font-bold text-[var(--text-primary)]">ログイン</h1>
            <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
              TGPLUSアカウントでログインしてください
            </p>
          </div>

          {state?.error ? (
            <div className="mb-6">
              <AuthAlert type="error" message={state.error} />
            </div>
          ) : null}

          {resetSuccess ? (
            <div className="mb-6">
              <AuthAlert
                type="success"
                message="パスワードを再設定しました。新しいパスワードでログインしてください。"
              />
            </div>
          ) : null}

          {isSuspended ? (
            <div className="mb-6">
              <AuthAlert
                type="error"
                message="アカウントが停止されています。管理者にお問い合わせください"
              />
            </div>
          ) : null}

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <AuthInput
              label="メールアドレス"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              error={state?.fieldErrors?.email}
              required
            />
            <AuthInput
              label="パスワード"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={state?.fieldErrors?.password}
              required
            />

            <p className="text-right text-sm">
              <Link
                href="/forgot-password"
                className="text-[var(--gold-dark)] underline-offset-4 transition-colors hover:underline"
              >
                パスワードを忘れた方
              </Link>
            </p>

            <button
              type="submit"
              disabled={isPending}
              className="btn-gold mt-2 w-full rounded-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "ログイン中..." : "ログインする"}
            </button>
          </form>

          <p className="ja-body mt-8 text-center text-sm text-[var(--text-muted)]">
            <Link
              href="/register"
              className="text-[var(--gold-dark)] underline-offset-4 transition-colors hover:underline"
            >
              新規登録はこちら
            </Link>
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}
