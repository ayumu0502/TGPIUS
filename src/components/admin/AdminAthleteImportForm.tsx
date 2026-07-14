"use client";

import { useActionState } from "react";
import { bulkImportAthletes } from "@/app/actions/admin-athletes";
import { AuthAlert } from "@/components/auth/AuthInput";
import type { BulkImportState } from "@/types/athlete-invite";

export default function AdminAthleteImportForm() {
  const [state, formAction, isPending] = useActionState<BulkImportState | null, FormData>(
    bulkImportAthletes,
    null
  );

  return (
    <form action={formAction} className="premium-card space-y-6 p-6 sm:p-8">
      {state?.error ? <AuthAlert type="error" message={state.error} /> : null}
      {state?.success ? <AuthAlert type="success" message={state.success} /> : null}
      {state?.errors?.length ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">一部エラー</p>
          <ul className="mt-2 list-inside list-disc">
            {state.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="text-sm text-[var(--text-muted)]">
          1行目はヘッダー行としてください。列名: 氏名, メールアドレス, 競技, 所属組織, 地域
        </p>
        <textarea
          name="csv"
          rows={12}
          placeholder={`氏名,メールアドレス,競技,所属組織,地域\n山田太郎,yamada@example.com,陸上,〇〇チーム,東京`}
          className="mt-3 w-full rounded-xl border border-[var(--card-border)] px-4 py-3 font-mono text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-gold rounded-full px-8 py-3 text-sm disabled:opacity-60"
      >
        {isPending ? "取り込み中..." : "CSV一括仮登録"}
      </button>
    </form>
  );
}
