"use client";

import { ProfileAvatar } from "@/components/social/SocialLayout";
import type { EventParticipant } from "@/types/events";

type EventParticipantsListProps = {
  participants: EventParticipant[];
  isCreator: boolean;
  eventId: string;
  checkinCode: string | null;
  onCheckin: (userId: string) => void;
  isPending: boolean;
  currentUserId: string;
};

export default function EventParticipantsList({
  participants,
  isCreator,
  checkinCode,
  onCheckin,
  isPending,
  currentUserId,
}: EventParticipantsListProps) {
  const visibleParticipants = isCreator
    ? participants
    : participants.filter((p) => p.user_id === currentUserId);

  return (
    <div className="premium-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            参加者一覧
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isCreator
              ? `${participants.length}名が参加登録中`
              : "あなたの参加状況"}
          </p>
        </div>
      </div>

      {visibleParticipants.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          参加者がまだいません
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {visibleParticipants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar
                  name={participant.user_name}
                  avatarUrl={participant.user_avatar_url}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {participant.user_name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(participant.registered_at).toLocaleString("ja-JP")}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    participant.status === "checked_in"
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {participant.status === "checked_in" ? "チェックイン済" : "参加登録"}
                </span>
                {isCreator &&
                participant.status === "registered" &&
                checkinCode ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onCheckin(participant.user_id)}
                    className="btn-gold rounded-full px-3 py-1.5 text-[10px] disabled:opacity-60"
                  >
                    チェックイン
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
