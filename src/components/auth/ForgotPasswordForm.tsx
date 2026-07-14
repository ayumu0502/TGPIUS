"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthInput, { AuthAlert } from "@/components/auth/AuthInput";

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

  return (
    <AuthPageShell
      headerAction={
        <Link
          href="/login"
          className="rounded-full border border-[var(--card-border)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
        >
          ログインへ戻る
        </Link>
      }
    >
      <div className="w-full max-w-md">
        <div className="premium-card animate-fade-in-up p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="ja-heading text-3xl font-bold text-[var(--text-primary)]">
              パスワード再設定
            </h1>
            <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
              登録済みのメールアドレスを入力してください。再設定用のリンクをお送りします。
            </p>
          </div>

          {state?.error ? (
            <div className="mb-6">
              <AuthAlert type="error" message={state.error} />
            </div>
          ) : null}

          {state?.success ? (
            <div className="mb-6">
              <AuthAlert type="success" message={state.success} />
            </div>
          ) : null}

          <form action={formAction} className="space-y-5">
            <AuthInput
              label="メールアドレス"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              error={state?.fieldErrors?.email}
              required
            />

            <button
              type="submit"
              disabled={isPending}
              className="btn-gold mt-2 w-full rounded-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "送信中..." : "再設定メールを送信"}
            </button>
          </form>

          <p className="ja-body mt-8 text-center text-sm text-[var(--text-muted)]">
            <Link
              href="/login"
              className="text-[var(--gold-dark)] underline-offset-4 transition-colors hover:underline"
            >
              ログイン画面へ戻る
            </Link>
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}
