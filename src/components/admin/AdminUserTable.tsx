"use client";

import { useActionState } from "react";
import { setUserSuspended } from "@/app/actions/admin";
import {
  ACCOUNT_TYPE_LABELS,
  formatAdminDate,
} from "@/lib/admin/constants";
import { formatPoints } from "@/lib/points/constants";
import type { AdminUser } from "@/types/admin";

type AdminUserTableProps = {
  users: AdminUser[];
  searchQuery: string;
};

function SuspendButton({
  userId,
  suspended,
  disabled,
}: {
  userId: string;
  suspended: boolean;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(setUserSuspended, null);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="suspended" value={suspended ? "false" : "true"} />
      <button
        type="submit"
        disabled={disabled || isPending}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
          suspended
            ? "border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--gold)]"
            : "bg-red-50 text-red-600 hover:bg-red-100"
        }`}
      >
        {isPending ? "..." : suspended ? "再開" : "停止"}
      </button>
      {state?.error ? (
        <p className="mt-1 text-xs text-red-400">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="mt-1 text-xs text-green-400">{state.success}</p>
      ) : null}
    </form>
  );
}

export default function AdminUserTable({
  users,
  searchQuery,
}: AdminUserTableProps) {
  return (
    <div>
      <form method="get" className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder="名前またはメールで検索"
          className="flex-1 rounded-xl border border-[var(--card-border)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
        />
        <button
          type="submit"
          className="btn-gold rounded-full px-5 py-2.5 text-sm"
        >
          検索
        </button>
      </form>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--card-border)] px-4 py-12 text-center">
          <p className="text-[var(--text-muted)]">該当するユーザーがいません</p>
        </div>
      ) : (
        <div className="premium-card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="px-4 py-3 font-medium">メール</th>
                <th className="px-4 py-3 font-medium">種別</th>
                <th className="px-4 py-3 font-medium">ポイント残高</th>
                <th className="px-4 py-3 font-medium">登録日</th>
                <th className="px-4 py-3 font-medium">状態</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[var(--card-border)] last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {user.name}
                    {user.is_admin ? (
                      <span className="badge-gold ml-2 rounded-full px-2 py-0.5 text-[10px]">
                        管理者
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{user.email}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {ACCOUNT_TYPE_LABELS[user.account_type]}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {user.account_type === "fan"
                      ? formatPoints(user.point_balance)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {formatAdminDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {user.is_suspended ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs text-red-600">
                        停止中
                      </span>
                    ) : (
                      <span className="badge-gold rounded-full px-2.5 py-0.5 text-xs">
                        有効
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SuspendButton
                      userId={user.id}
                      suspended={user.is_suspended}
                      disabled={user.is_admin}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
