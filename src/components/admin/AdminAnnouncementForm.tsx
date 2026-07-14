"use client";

import { useActionState } from "react";
import { broadcastAdminAnnouncement } from "@/app/actions/admin";

export default function AdminAnnouncementForm() {
  const [state, formAction, isPending] = useActionState(broadcastAdminAnnouncement, null);

  return (
    <form
      action={formAction}
      className="premium-card space-y-4 p-6"
      onSubmit={(event) => {
        if (!window.confirm("全ユーザーにお知らせを配信しますか？")) {
          event.preventDefault();
        }
      }}
    >
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">お知らせ配信</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          停止中ユーザーを除く全員に通知を送信します
        </p>
      </div>

      {state?.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium">タイトル *</label>
        <input
          name="title"
          required
          className="w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          placeholder="メンテナンスのお知らせ"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">本文</label>
        <textarea
          name="body"
          rows={4}
          className="w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          placeholder="詳細内容"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">リンクURL</label>
        <input
          name="link_url"
          defaultValue="/notifications"
          className="w-full rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="btn-gold rounded-full px-6 py-3 text-sm disabled:opacity-50"
      >
        {isPending ? "配信中..." : "お知らせを配信"}
      </button>
    </form>
  );
}
