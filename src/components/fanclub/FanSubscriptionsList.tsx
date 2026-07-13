"use client";

import { useState, useTransition } from "react";
import { cancelFanclubMembership } from "@/app/actions/fanclub";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import {
  formatMembershipPeriod,
  formatYen,
  MEMBERSHIP_STATUS_LABELS,
} from "@/lib/fanclub/constants";
import type { FanclubMembership } from "@/types/fanclub";

export default function FanSubscriptionsList({
  subscriptions,
}: {
  subscriptions: FanclubMembership[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (subscriptions.length === 0) {
    return (
      <div className="premium-card px-6 py-16 text-center">
        <p className="text-[var(--text-muted)]">加入中のサブスクリプションはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((item) => {
        const isActive =
          item.status === "active" && new Date(item.current_period_end) > new Date();

        return (
          <div key={item.id} className="premium-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  name={item.athlete_name ?? "選手"}
                  avatarUrl={item.athlete_avatar_url}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {item.athlete_name}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {item.plan_title} · {formatYen(item.price_yen)}/月
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {formatMembershipPeriod(item.started_at, item.current_period_end)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {MEMBERSHIP_STATUS_LABELS[item.status]}
                </span>
                {isActive ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await cancelFanclubMembership(item.id);
                        setMessage(result.message);
                      })
                    }
                    className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-red-300 hover:text-red-600 disabled:opacity-60"
                  >
                    解約する
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      {message ? <p className="text-sm text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
