"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthInput, { AuthAlert } from "@/components/auth/AuthInput";

type ResetPasswordFormProps = {
  invalidLink?: boolean;
};

export default function ResetPasswordForm({ invalidLink = false }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  if (invalidLink) {
    return (
      <AuthPageShell
        headerAction={
          <Link href="/login" className="btn-gold rounded-full px-5 py-2.5 text-sm">
            ログイン
          </Link>
        }
      >
        <div className="w-full max-w-md">
          <div className="premium-card p-8 text-center sm:p-10">
            <h1 className="ja-heading text-2xl font-bold text-[var(--text-primary)]">
              リンクが無効です
            </h1>
            <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
              パスワード再設定リンクが無効または期限切れです。もう一度お試しください。
            </p>
            <Link
              href="/forgot-password"
              className="btn-gold mt-6 inline-block rounded-full px-6 py-3 text-sm"
            >
              パスワード再設定をやり直す
            </Link>
          </div>
        </div>
      </AuthPageShell>
    );
  }

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
              新しいパスワード
            </h1>
            <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
              新しいパスワードを入力して設定を完了してください。
            </p>
          </div>

          {state?.error ? (
            <div className="mb-6">
              <AuthAlert type="error" message={state.error} />
            </div>
          ) : null}

          <form action={formAction} className="space-y-5">
            <AuthInput
              label="新しいパスワード"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8文字以上"
              minLength={8}
              error={state?.fieldErrors?.password}
              required
            />
            <AuthInput
              label="新しいパスワード（確認）"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="もう一度入力"
              minLength={8}
              required
            />

            <button
              type="submit"
              disabled={isPending}
              className="btn-gold mt-2 w-full rounded-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "設定中..." : "パスワードを設定する"}
            </button>
          </form>
        </div>
      </div>
    </AuthPageShell>
  );
}
