"use client";

import type { GiftAmount } from "@/types/gifts";
import { formatPoints, getGiftLabel, GIFT_AMOUNTS } from "@/lib/gifts/constants";

type GiftAmountSelectorProps = {
  name: string;
  selected: GiftAmount | null;
  onChange: (amount: GiftAmount) => void;
  disabled?: boolean;
  error?: string;
};

export default function GiftAmountSelector({
  name,
  selected,
  onChange,
  disabled = false,
  error,
}: GiftAmountSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--text-primary)]">ギフトを選ぶ</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {GIFT_AMOUNTS.map((amount) => {
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
                className={`mt-1 text-xs ${
                  isSelected ? "text-[var(--gold-dark)]" : "text-[var(--text-muted)]"
                }`}
              >
                {getGiftLabel(amount)}
              </p>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
