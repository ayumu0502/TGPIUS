"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthInput, { AuthAlert } from "@/components/auth/AuthInput";
import type { AthleteInvitePublic } from "@/types/athlete-invite";

type InviteRegisterFormProps = {
  invite: AthleteInvitePublic;
  token: string;
};

export default function InviteRegisterForm({ invite, token }: InviteRegisterFormProps) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";
  const [state, formAction, isPending] = useActionState(register, null);

  return (
    <AuthPageShell
      headerAction={
        <Link href="/login" className="btn-gold rounded-full px-5 py-2.5 text-sm">
          ログイン
        </Link>
      }
    >
      <div className="w-full max-w-md">
        <div className="premium-card p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="ja-heading text-3xl font-bold">アスリート登録</h1>
            <p className="ja-body mt-3 text-sm text-[var(--text-muted)]">
              {invite.full_name} 様 — {invite.sport}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              有効期限: {new Date(invite.expires_at).toLocaleString("ja-JP")}
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
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input type="hidden" name="inviteToken" value={token} />
            <input type="hidden" name="accountType" value="athlete" />

            <AuthInput
              label="氏名"
              name="name"
              defaultValue={invite.full_name}
              required
            />
            <AuthInput
              label="メールアドレス"
              name="email"
              type="email"
              defaultValue={invite.email}
              readOnly
              required
            />
            <AuthInput
              label="パスワード"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8文字以上"
              error={state?.fieldErrors?.password}
              required
            />

            <button
              type="submit"
              disabled={isPending}
              className="btn-gold mt-2 w-full rounded-full py-3.5 text-sm disabled:opacity-60"
            >
              {isPending ? "登録中..." : "登録を完了する"}
            </button>
          </form>
        </div>
      </div>
    </AuthPageShell>
  );
}
