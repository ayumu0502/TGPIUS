"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  cancelEventParticipation,
  checkinParticipant,
  joinEvent,
} from "@/app/actions/events";
import EventParticipantsList from "@/components/events/EventParticipantsList";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import {
  AVAILABILITY_STYLES,
  EVENT_STATUS_LABELS,
  formatEventDateTime,
  formatEventFee,
  formatEventLocation,
  getCheckinUrl,
  getEventAvailability,
  LOCATION_TYPE_LABELS,
} from "@/lib/events/constants";
import type { EventParticipant, EventSummary } from "@/types/events";

type EventDetailViewProps = {
  event: EventSummary;
  participants: EventParticipant[];
  currentUserId: string;
  siteOrigin: string;
};

export default function EventDetailView({
  event,
  participants,
  currentUserId,
  siteOrigin,
}: EventDetailViewProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const availability = getEventAvailability(event);
  const canJoin =
    availability === "受付中" &&
    !event.is_joined &&
    !event.is_creator;
  const canCancel = event.is_joined && availability === "受付中";
  const checkinUrl =
    event.checkin_code && event.is_creator
      ? getCheckinUrl(event.id, event.checkin_code, siteOrigin)
      : null;

  const runAction = (action: () => Promise<{ ok: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);
    });
  };

  return (
    <div className="space-y-6">
      <div className="premium-card overflow-hidden">
        <div className="premium-event-hero p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                AVAILABILITY_STYLES[availability]
              }`}
            >
              {availability}
            </span>
            <span className="badge-gold rounded-full px-2.5 py-1 text-xs">
              {EVENT_STATUS_LABELS[event.status]}
            </span>
            <span className="rounded-full bg-[rgba(197,160,89,0.15)] px-2.5 py-1 text-xs text-[var(--gold-dark)]">
              {formatEventFee(event.fee_points)}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            {event.title}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <ProfileAvatar
              name={event.creator_name}
              avatarUrl={event.creator_avatar_url}
              size="md"
            />
            <div>
              <Link
                href={`/profile/${event.creator_id}`}
                className="font-medium text-[var(--text-primary)] hover:text-[var(--gold-dark)]"
              >
                {event.creator_name}
              </Link>
              <p className="text-sm text-[var(--text-muted)]">
                {event.creator_sport || "アスリート"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <p className="text-xs text-[var(--text-muted)]">開催日時</p>
            <p className="mt-1 font-medium text-[var(--text-primary)]">
              {formatEventDateTime(event.starts_at)}
            </p>
            {event.ends_at ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                終了: {formatEventDateTime(event.ends_at)}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">形式</p>
            <p className="mt-1 font-medium text-[var(--text-primary)]">
              {LOCATION_TYPE_LABELS[event.location_type]}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">開催場所</p>
            <p className="mt-1 font-medium text-[var(--text-primary)]">
              {formatEventLocation(event)}
            </p>
            {event.venue_address ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {event.venue_address}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">定員 / 参加費</p>
            <p className="mt-1 font-medium text-[var(--text-primary)]">
              {event.participant_count}/{event.capacity}名 · {formatEventFee(event.fee_points)}
            </p>
          </div>
        </div>

        {(event.online_url || event.description) && (
          <div className="border-t border-[var(--card-border)] p-6 sm:p-8">
            {event.online_url ? (
              <div className="mb-4">
                <p className="text-xs text-[var(--text-muted)]">オンラインURL</p>
                <a
                  href={event.online_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block break-all text-sm text-[var(--gold-dark)] hover:underline"
                >
                  {event.online_url}
                </a>
              </div>
            ) : null}
            {event.description ? (
              <div>
                <p className="text-xs text-[var(--text-muted)]">イベント詳細</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                  {event.description}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap gap-3">
          {canJoin ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => joinEvent(event.id))}
              className="btn-gold rounded-full px-6 py-2.5 text-sm disabled:opacity-60"
            >
              参加する
            </button>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => cancelEventParticipation(event.id))}
              className="rounded-full border border-[var(--card-border)] px-6 py-2.5 text-sm text-[var(--text-secondary)] hover:border-red-300 hover:text-red-600 disabled:opacity-60"
            >
              参加をキャンセル
            </button>
          ) : null}
          {event.is_creator ? (
            <Link
              href="/events/my"
              className="rounded-full border border-[var(--card-border)] px-6 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--gold)]"
            >
              作成イベント一覧
            </Link>
          ) : null}
        </div>
        {message ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">{message}</p>
        ) : null}
      </div>

      {event.is_creator && event.checkin_code ? (
        <div className="premium-card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            QRチェックイン準備
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            イベント当日は参加者のQRコードまたはチェックインコードで受付できます
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-[180px_1fr]">
            {checkinUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkinUrl)}`}
                  alt="チェックインQRコード"
                  width={180}
                  height={180}
                  className="rounded-xl border border-[var(--card-border)] bg-white p-2"
                />
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">受付用QR</p>
              </div>
            ) : null}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--text-muted)]">チェックインコード</p>
                <p className="mt-1 font-mono text-lg font-bold tracking-wider text-[var(--gold-dark)]">
                  {event.checkin_code}
                </p>
              </div>
              {checkinUrl ? (
                <div>
                  <p className="text-xs text-[var(--text-muted)]">チェックインURL</p>
                  <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">
                    {checkinUrl}
                  </p>
                </div>
              ) : null}
              <p className="text-xs text-[var(--text-muted)]">
                参加者一覧から手動チェックインも可能です
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <EventParticipantsList
        participants={participants}
        isCreator={event.is_creator}
        eventId={event.id}
        checkinCode={event.checkin_code}
        onCheckin={(userId) =>
          runAction(() =>
            checkinParticipant(event.id, userId, event.checkin_code ?? "")
          )
        }
        isPending={isPending}
        currentUserId={currentUserId}
      />
    </div>
  );
}
