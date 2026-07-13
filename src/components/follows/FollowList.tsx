"use client";

import Link from "next/link";
import FollowUserCard from "@/components/follows/FollowUserCard";
import { ProfileEmptyState } from "@/components/profile/ProfileStates";
import type { FollowUserEntry } from "@/types/follows";

type FollowListProps = {
  title: string;
  description?: string;
  users: FollowUserEntry[];
  currentUserId: string;
  emptyTitle: string;
  emptyDescription?: string;
  viewAllHref?: string;
};

export default function FollowList({
  title,
  description,
  users,
  currentUserId,
  emptyTitle,
  emptyDescription,
  viewAllHref,
}: FollowListProps) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm text-[var(--gold-dark)] hover:underline">
            すべて見る ›
          </Link>
        ) : null}
      </div>

      {users.length === 0 ? (
        <ProfileEmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {users.map((user) => (
            <FollowUserCard key={user.id} user={user} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </section>
  );
}
