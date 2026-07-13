"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  PERIOD_LOCKED_CATEGORIES,
  RANKING_CATEGORIES,
  RANKING_PERIODS,
} from "@/lib/rankings/constants";
import type { RankingCategory, RankingPeriod } from "@/types/rankings";

export default function RankingTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current =
    (searchParams.get("category") as RankingCategory) || "overall";

  const setCategory = (category: RankingCategory) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category);

    const locked = RANKING_CATEGORIES.find((item) => item.value === category);
    if (locked?.fixedPeriod) {
      params.set("period", locked.fixedPeriod);
    }

    router.push(`/rankings?${params.toString()}`);
  };

  return (
    <div className="premium-card p-3 sm:p-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {RANKING_CATEGORIES.map((item) => {
          const active = current === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${
                active
                  ? "bg-[rgba(197,160,89,0.15)] text-[var(--gold-dark)] font-medium"
                  : "bg-zinc-100 text-[var(--text-secondary)] hover:bg-zinc-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {RANKING_CATEGORIES.find((item) => item.value === current)?.description}
      </p>
    </div>
  );
}

export function RankingPeriodTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category =
    (searchParams.get("category") as RankingCategory) || "overall";
  const current = (searchParams.get("period") as RankingPeriod) || "month";

  if (PERIOD_LOCKED_CATEGORIES.includes(category)) {
    return null;
  }

  const setPeriod = (period: RankingPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`/rankings?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {RANKING_PERIODS.map((item) => {
        const active = current === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setPeriod(item.value)}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${
              active
                ? "btn-gold"
                : "border border-[var(--card-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--gold)]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
