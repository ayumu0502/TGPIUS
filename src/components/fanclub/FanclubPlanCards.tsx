"use client";

import { useState, useTransition } from "react";
import { subscribeFanclubPlan } from "@/app/actions/fanclub";
import {
  BENEFIT_LABELS,
  formatYen,
  getTestPaymentNote,
} from "@/lib/fanclub/constants";
import type { FanclubBenefit, FanclubBenefitType, FanclubPlan } from "@/types/fanclub";

function getBenefitLabels(plan: FanclubPlan): string[] {
  return plan.benefits.map((benefit) => {
    if (typeof benefit === "string") return BENEFIT_LABELS[benefit as FanclubBenefitType];
    return (benefit as FanclubBenefit).title || BENEFIT_LABELS[(benefit as FanclubBenefit).benefit_type];
  });
}

export default function FanclubPlanCards({
  plans,
  activePlanId,
  canSubscribe,
}: {
  plans: FanclubPlan[];
  activePlanId?: string | null;
  canSubscribe: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = (planId: string) => {
    startTransition(async () => {
      const result = await subscribeFanclubPlan(planId);
      setMessage(result.message);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const isActive = activePlanId === plan.id;
          const benefits = getBenefitLabels(plan);

          return (
            <div
              key={plan.id}
              className={`premium-card p-5 ${
                isActive ? "border-[var(--gold)]/40 ring-1 ring-[var(--gold)]/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{formatYen(plan.price_yen)}/月</p>
                  <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                    {plan.title}
                  </h3>
                </div>
                {isActive ? (
                  <span className="rounded-full bg-[var(--gold)]/15 px-3 py-1 text-xs font-medium text-[var(--gold-dark)]">
                    加入中
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {plan.description || "会員限定コンテンツと特典が利用できます"}
              </p>

              <ul className="mt-4 space-y-2">
                {benefits.map((label) => (
                  <li key={label} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--gold)]">✓</span>
                    {label}
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-[var(--text-muted)]">
                会員 {plan.member_count}人 · {getTestPaymentNote(plan.price_yen)}
              </p>

              {canSubscribe && !isActive ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSubscribe(plan.id)}
                  className="btn-gold mt-4 w-full rounded-full py-2.5 text-sm disabled:opacity-60"
                >
                  このプランに加入
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {message ? <p className="text-sm text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
