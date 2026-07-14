"use client";

import { useActionState, useState } from "react";
import { deleteUserAccount } from "@/app/actions/admin";

type DeleteUserFormProps = {
  userId: string;
  userName: string;
  userEmail: string;
};

export default function DeleteUserForm({
  userId,
  userName,
  userEmail,
}: DeleteUserFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteUserAccount, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
      >
        削除
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-2 space-y-2 rounded-xl border border-red-200 bg-red-50/50 p-3"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `${userName} のアカウントを完全に削除します。この操作は取り消せません。`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <p className="text-xs text-red-700">
        確認のためメールアドレスを入力してください
      </p>
      <input
        type="email"
        name="confirm_email"
        required
        placeholder={userEmail}
        className="w-full min-w-[200px] rounded-lg border border-red-200 bg-white px-3 py-2 text-xs focus:border-red-400 focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "削除中..." : "削除を実行"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
        >
          キャンセル
        </button>
      </div>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state?.success ? (
        <p className="text-xs text-emerald-600">{state.success}</p>
      ) : null}
    </form>
  );
}
