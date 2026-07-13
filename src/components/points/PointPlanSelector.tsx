"use client";

import type { PurchaseAmount } from "@/types/points";
import {
  formatPoints,
  getPurchaseLabel,
  PURCHASE_AMOUNTS,
} from "@/lib/points/constants";

type PointPlanSelectorProps = {
  name: string;
  selected: PurchaseAmount | null;
  onChange: (amount: PurchaseAmount) => void;
  disabled?: boolean;
  error?: string;
};

export default function PointPlanSelector({
  name,
  selected,
  onChange,
  disabled = false,
  error,
}: PointPlanSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--text-primary)]">購入プランを選ぶ</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {PURCHASE_AMOUNTS.map((amount) => {
          const isSelected = selected === amount;
          return (
            <label
              key={amount}
              className={`relative cursor-pointer rounded-2xl border p-4 text-center transition-all duration-200 ${
                isSelected
                  ? "border-[var(--gold)] bg-[rgba(197,160,89,0.08)] text-[var(--text-primary)]"
                  : "border-[var(--card-border)] bg-white text-[var(--text-primary)] hover:border-[var(--gold)]/50"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={amount}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(amount)}
                className="sr-only"
              />
              <p className="text-lg font-bold">{formatPoints(amount)}</p>
              <p
                className={`mt-2 text-[10px] ${
                  isSelected ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                }`}
              >
                {getPurchaseLabel(amount)}
              </p>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
