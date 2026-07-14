"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { register } from "@/app/actions/auth";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthInput, { AuthAlert } from "@/components/auth/AuthInput";
import type { AccountType } from "@/types/auth";

const accountTypes: { id: AccountType; label: string; description: string }[] = [
  { id: "fan", label: "ファン", description: "選手を応援したい方" },
  { id: "athlete", label: "アスリート", description: "活動を発信したい方" },
  { id: "sponsor", label: "企業スポンサー", description: "選手を支援したい企業" },
];

export default function RegisterForm() {
  const [accountType, setAccountType] = useState<AccountType>("fan");
  const [state, formAction, isPending] = useActionState(register, null);

  return (
    <AuthPageShell
      headerAction={
        <Link
          href="/login"
          className="rounded-full border border-[var(--card-border)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
        >
          ログイン
        </Link>
      }
    >
      <div className="w-full max-w-lg">
        <div className="premium-card animate-fade-in-up p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="ja-heading text-3xl font-bold text-[var(--text-primary)]">
              新規会員登録
            </h1>
            <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
              あなたに合ったアカウントタイプを選択してください
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

          <form action={formAction} className="space-y-6">
            <input type="hidden" name="accountType" value={accountType} />

            <fieldset>
              <legend className="sr-only">アカウントタイプ</legend>
              {state?.fieldErrors?.accountType ? (
                <p className="mb-3 text-sm text-red-500">{state.fieldErrors.accountType}</p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                {accountTypes.map((type) => {
                  const selected = accountType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAccountType(type.id)}
                      aria-pressed={selected}
                      className={`premium-card-hover rounded-xl border p-4 text-left transition-all duration-200 ${
                        selected
                          ? "border-[var(--gold)] bg-[rgba(197,160,89,0.08)] shadow-md"
                          : "border-[var(--card-border)] hover:border-[rgba(197,160,89,0.3)]"
                      }`}
                    >
                      <span
                        className={`block text-sm font-semibold ${
                          selected ? "text-[var(--gold-dark)]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {type.label}
                      </span>
                      <span className="ja-body mt-1 block text-xs text-[var(--text-muted)]">
                        {type.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              {accountType === "athlete" ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  アスリート登録後は選手申請・審査が必要です。承認後に活動を開始できます。
                </p>
              ) : null}
            </fieldset>

            <AuthInput
              label="お名前"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="山田 太郎"
              error={state?.fieldErrors?.name}
              required
            />
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
              autoComplete="new-password"
              placeholder="8文字以上"
              minLength={8}
              error={state?.fieldErrors?.password}
              required
            />

            <button
              type="submit"
              disabled={isPending}
              className="btn-gold w-full rounded-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "作成中..." : "アカウントを作成する"}
            </button>
          </form>

          <p className="ja-body mt-8 text-center text-sm text-[var(--text-muted)]">
            <Link
              href="/login"
              className="text-[var(--gold-dark)] underline-offset-4 transition-colors hover:underline"
            >
              すでにアカウントをお持ちの方はこちら
            </Link>
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}
