"use client";

import { useActionState } from "react";
import { createFanclubPostAction } from "@/app/actions/fanclub";
import { POST_TYPE_OPTIONS } from "@/lib/fanclub/constants";
import type { FanclubActionState, FanclubPlan } from "@/types/fanclub";

const initialState: FanclubActionState = { ok: false, message: "" };

export default function AthleteFanclubPostForm({ plans }: { plans: FanclubPlan[] }) {
  const [state, formAction, isPending] = useActionState(createFanclubPostAction, initialState);

  return (
    <form action={formAction} className="premium-card space-y-4 p-5">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">会員限定コンテンツ投稿</h3>

      <label className="block">
        <span className="text-xs text-[var(--text-muted)]">種類</span>
        <select name="post_type" defaultValue="post" className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm">
          {POST_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs text-[var(--text-muted)]">対象プラン</span>
        <select name="plan_id" defaultValue="" className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm">
          <option value="">全プラン会員</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.title}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs text-[var(--text-muted)]">タイトル</span>
        <input name="title" required className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm" />
      </label>

      <label className="block">
        <span className="text-xs text-[var(--text-muted)]">内容</span>
        <textarea name="content" rows={4} className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm" />
      </label>

      <label className="block">
        <span className="text-xs text-[var(--text-muted)]">メディアURL（任意）</span>
        <input name="media_url" type="url" className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm" />
      </label>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-gold rounded-full px-6 py-2.5 text-sm disabled:opacity-60">
        {isPending ? "公開中..." : "会員限定コンテンツを公開"}
      </button>
    </form>
  );
}
