"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { sendGift } from "@/app/actions/gifts";
import { AuthAlert } from "@/components/auth/AuthInput";
import GiftAmountSelector from "@/components/gifts/GiftAmountSelector";
import GiftSendAnimation from "@/components/gifts/GiftSendAnimation";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { formatPoints } from "@/lib/gifts/constants";
import type { GiftAmount, GiftAthleteSummary } from "@/types/gifts";

type GiftSendFormProps = {
  athlete: GiftAthleteSummary;
  pointBalance: number;
};

export default function GiftSendForm({ athlete, pointBalance }: GiftSendFormProps) {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<GiftAmount | null>(null);
  const [displayBalance, setDisplayBalance] = useState(pointBalance);
  const [animating, setAnimating] = useState(false);
  const [state, formAction, isPending] = useActionState(sendGift, null);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (state?.success && selectedAmount) {
      setDisplayBalance((b) => Math.max(0, b - selectedAmount));
      setAnimating(true);
    }
  }, [state?.success, selectedAmount]);

  const handleAnimationDone = () => {
    router.push("/fan/gifts");
    router.refresh();
  };

  return (
    <>
      <GiftSendAnimation
        amount={selectedAmount ?? 0}
        show={animating}
        onDone={handleAnimationDone}
      />

      <div className="premium-card p-6 sm:p-8">
        <div className="flex items-center gap-4 border-b border-[var(--card-border)] pb-6">
          <ProfileAvatar name={athlete.name} avatarUrl={athlete.avatar_url} size="md" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">送信先</p>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{athlete.name}</h2>
            {athlete.sport ? (
              <p className="text-sm text-[var(--text-secondary)]">{athlete.sport}</p>
            ) : null}
          </div>
        </div>

        <div
          className={`mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4 transition-all duration-500 ${animating ? "scale-[0.98] opacity-80" : ""}`}
        >
          <p className="text-xs text-[var(--text-muted)]">ポイント残高</p>
          <p
            className={`mt-1 text-2xl font-bold text-[var(--text-primary)] transition-all duration-700 ${animating ? "text-[var(--gold-dark)]" : ""}`}
          >
            {formatPoints(displayBalance)}
          </p>
        </div>

        {state?.error ? (
          <div className="mt-4">
            <AuthAlert type="error" message={state.error} />
          </div>
        ) : null}

        <form action={formAction} className="mt-8 space-y-8">
          <input type="hidden" name="receiver_id" value={athlete.id} />
          <input type="hidden" name="amount" value={selectedAmount ?? ""} />
          <input type="hidden" name="idempotency_key" value={idempotencyKey} />

          <GiftAmountSelector
            name="amount_display"
            selected={selectedAmount}
            onChange={setSelectedAmount}
            disabled={isPending || animating}
            error={state?.fieldErrors?.amount}
          />

          <div>
            <label htmlFor="message" className="text-sm font-medium text-[var(--text-primary)]">
              応援メッセージ
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={200}
              placeholder="いつも応援しています！"
              disabled={isPending || animating}
              className="ja-body mt-3 w-full rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
            />
            {state?.fieldErrors?.message ? (
              <p className="mt-2 text-sm text-red-500">{state.fieldErrors.message}</p>
            ) : (
              <p className="mt-2 text-xs text-[var(--text-muted)]">200文字以内（任意）</p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isPending ||
              animating ||
              !selectedAmount ||
              displayBalance < (selectedAmount ?? 0)
            }
            className="btn-gold w-full rounded-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "送信中..." : "ギフトを送る"}
          </button>
        </form>
      </div>
    </>
  );
}
