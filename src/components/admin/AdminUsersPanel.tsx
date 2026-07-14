"use client";

import Link from "next/link";
import { useActionState } from "react";
import { setUserSuspended } from "@/app/actions/admin";
import DeleteUserForm from "@/components/admin/DeleteUserForm";
import {
  ACCOUNT_TYPE_LABELS,
  formatAdminDate,
} from "@/lib/admin/constants";
import { formatPoints } from "@/lib/points/constants";
import { ATHLETE_REVIEW_STATUS_LABELS } from "@/types/athlete-application";
import type { AthleteReviewStatus } from "@/types/athlete-application";
import type { AdminUser } from "@/types/admin";
import type { AccountType } from "@/types/auth";

type AdminUsersPanelProps = {
  users: (AdminUser & { athlete_review_status?: AthleteReviewStatus | null })[];
  searchQuery: string;
  accountType: AccountType | "all";
};

function SuspendButton({
  userId,
  userName,
  suspended,
  disabled,
}: {
  userId: string;
  userName: string;
  suspended: boolean;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(setUserSuspended, null);

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(event) => {
        const message = suspended
          ? `${userName} のアカウントを再開しますか？`
          : `${userName} のアカウントを停止しますか？ログインできなくなります。`;
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
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
      {state?.error ? <p className="mt-1 text-xs text-red-500">{state.error}</p> : null}
      {state?.success ? <p className="mt-1 text-xs text-emerald-600">{state.success}</p> : null}
    </form>
  );
}

function UserCard({
  user,
}: {
  user: AdminUser & { athlete_review_status?: AthleteReviewStatus | null };
}) {
  return (
    <div className="premium-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[var(--text-primary)]">
            {user.name}
            {user.is_admin ? (
              <span className="badge-gold ml-2 rounded-full px-2 py-0.5 text-[10px]">
                管理者
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{user.email}</p>
        </div>
        {user.is_suspended ? (
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
            停止中
          </span>
        ) : (
          <span className="badge-gold shrink-0 rounded-full px-2 py-0.5 text-[10px]">有効</span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
        <p>種別: {ACCOUNT_TYPE_LABELS[user.account_type]}</p>
        <p>
          審査:{" "}
          {user.account_type === "athlete" && user.athlete_review_status
            ? ATHLETE_REVIEW_STATUS_LABELS[user.athlete_review_status]
            : "—"}
        </p>
        <p>
          ポイント:{" "}
          {user.account_type === "fan" ? formatPoints(user.point_balance) : "—"}
        </p>
        <p>登録: {formatAdminDate(user.created_at)}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {user.account_type === "athlete" ? (
          <Link
            href={`/admin/applications?q=${encodeURIComponent(user.email)}`}
            className="rounded-full border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium hover:border-[var(--gold)]"
          >
            申請を見る
          </Link>
        ) : null}
        <SuspendButton
          userId={user.id}
          userName={user.name}
          suspended={user.is_suspended}
          disabled={user.is_admin}
        />
        {!user.is_admin ? (
          <DeleteUserForm
            userId={user.id}
            userName={user.name}
            userEmail={user.email}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function AdminUsersPanel({
  users,
  searchQuery,
  accountType,
}: AdminUsersPanelProps) {
  return (
    <div>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        「停止」はアカウント全体のログイン停止、「申請を見る」からアスリート機能のみの利用停止・復帰ができます。
      </p>

      <form method="get" className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder="名前またはメールで検索"
          className="flex-1 rounded-xl border border-[var(--card-border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
        />
        <select
          name="type"
          defaultValue={accountType}
          className="rounded-xl border border-[var(--card-border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
        >
          <option value="all">すべて</option>
          <option value="fan">ファン</option>
          <option value="athlete">アスリート</option>
          <option value="sponsor">スポンサー</option>
        </select>
        <button type="submit" className="btn-gold rounded-full px-5 py-2.5 text-sm">
          検索
        </button>
      </form>

      <div className="space-y-3 md:hidden">
        {users.length === 0 ? (
          <div className="premium-card px-4 py-10 text-center text-sm text-[var(--text-muted)]">
            該当するユーザーがいません
          </div>
        ) : (
          users.map((user) => <UserCard key={user.id} user={user} />)
        )}
      </div>

      <div className="premium-card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">名前</th>
              <th className="px-4 py-3 font-medium">メール</th>
              <th className="px-4 py-3 font-medium">種別</th>
              <th className="px-4 py-3 font-medium">審査</th>
              <th className="px-4 py-3 font-medium">ポイント</th>
              <th className="px-4 py-3 font-medium">登録日</th>
              <th className="px-4 py-3 font-medium">状態</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  該当するユーザーがいません
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {user.name}
                    {user.is_admin ? (
                      <span className="badge-gold ml-2 rounded-full px-2 py-0.5 text-[10px]">
                        管理者
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{user.email}</td>
                  <td className="px-4 py-3">{ACCOUNT_TYPE_LABELS[user.account_type]}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {user.account_type === "athlete" && user.athlete_review_status
                      ? ATHLETE_REVIEW_STATUS_LABELS[user.athlete_review_status]
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {user.account_type === "fan" ? formatPoints(user.point_balance) : "—"}
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
                      <span className="badge-gold rounded-full px-2.5 py-0.5 text-xs">有効</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {user.account_type === "athlete" ? (
                          <Link
                            href={`/admin/applications?q=${encodeURIComponent(user.email)}`}
                            className="rounded-full border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium hover:border-[var(--gold)]"
                          >
                            申請
                          </Link>
                        ) : null}
                        <SuspendButton
                          userId={user.id}
                          userName={user.name}
                          suspended={user.is_suspended}
                          disabled={user.is_admin}
                        />
                      </div>
                      {!user.is_admin ? (
                        <DeleteUserForm
                          userId={user.id}
                          userName={user.name}
                          userEmail={user.email}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
