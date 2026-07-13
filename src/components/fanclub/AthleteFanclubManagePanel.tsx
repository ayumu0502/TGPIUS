"use client";

import { useActionState } from "react";
import { saveFanclubPlanAction } from "@/app/actions/fanclub";
import {
  BENEFIT_OPTIONS,
  FANCLUB_PRICES,
  formatYen,
} from "@/lib/fanclub/constants";
import type { FanclubActionState, FanclubPlan } from "@/types/fanclub";

const initialState: FanclubActionState = { ok: false, message: "" };

export default function AthleteFanclubManagePanel({
  plans,
}: {
  plans: FanclubPlan[];
}) {
  const [state, formAction, isPending] = useActionState(saveFanclubPlanAction, initialState);

  return (
    <div className="space-y-6">
      <div className="premium-card p-5 sm:p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">月額プラン作成</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          価格帯ごとにプランと特典を設定できます（テスト決済: ポイント消費）
        </p>

        <form action={formAction} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">価格</span>
              <select
                name="price_yen"
                defaultValue={1000}
                className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm"
              >
                {FANCLUB_PRICES.map((price) => (
                  <option key={price} value={price}>
                    {formatYen(price)}/月
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">プラン名</span>
              <input
                name="title"
                required
                placeholder="例: スタンダード会員"
                className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-[var(--text-muted)]">説明</span>
            <textarea
              name="description"
              rows={3}
              className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm"
            />
          </label>

          <div>
            <p className="text-xs text-[var(--text-muted)]">特典</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {BENEFIT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-2 rounded-xl border border-[var(--card-border)] p-3"
                >
                  <input type="checkbox" name="benefit_types" value={option.value} />
                  <span>
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {state.message ? (
            <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="btn-gold rounded-full px-6 py-2.5 text-sm disabled:opacity-60"
          >
            {isPending ? "保存中..." : "プランを保存"}
          </button>
        </form>
      </div>

      {plans.length > 0 ? (
        <div className="premium-card p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">公開中プラン</h3>
          <ul className="mt-4 space-y-3">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] p-3"
              >
                <div>
                  <p className="font-medium">{plan.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatYen(plan.price_yen)}/月 · 会員 {plan.member_count}人
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
