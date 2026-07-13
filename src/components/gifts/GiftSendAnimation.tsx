"use client";

import { useEffect, useState } from "react";
import { formatPoints } from "@/lib/gifts/constants";

type GiftSendAnimationProps = {
  amount: number;
  show: boolean;
  onDone?: () => void;
};

export default function GiftSendAnimation({ amount, show, onDone }: GiftSendAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1800);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="gift-send-overlay" aria-live="polite">
      <div className="gift-send-burst" />
      <div className="gift-send-card">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold-dark)]">
          Gift Sent
        </p>
        <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
          {formatPoints(amount)}
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">応援を届けました</p>
      </div>
    </div>
  );
}
