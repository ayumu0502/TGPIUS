import Link from "next/link";
import GiftHistoryList from "@/components/gifts/GiftHistoryList";
import FollowUserCard from "@/components/follows/FollowUserCard";
import EventCard from "@/components/events/EventCard";
import NextEventWidget from "@/components/events/NextEventWidget";
import RankingPreviewWidget from "@/components/rankings/RankingPreviewWidget";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { formatPoints } from "@/lib/points/constants";
import type { GiftAthleteSummary, GiftRecord } from "@/types/gifts";
import type { EventSummary } from "@/types/events";
import type { FollowUserEntry } from "@/types/follows";
import type { RankingPreviewAthlete } from "@/types/rankings";

type PremiumFanDashboardProps = {
  userName: string;
  userId: string;
  pointBalance: number;
  giftCount: number;
  totalSent: number;
  athletes: GiftAthleteSummary[];
  followingAthletes: FollowUserEntry[];
  recentGifts: GiftRecord[];
  rankingAthletes: RankingPreviewAthlete[];
  nextEvent: EventSummary | null;
  upcomingEvents: EventSummary[];
};

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`premium-card premium-card-hover p-5 ${
        highlight ? "border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/5 to-white" : ""
      }`}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-[var(--gold-dark)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export default function PremiumFanDashboard({
  userName,
  userId,
  pointBalance,
  giftCount,
  totalSent,
  athletes,
  followingAthletes,
  recentGifts,
  rankingAthletes,
  nextEvent,
  upcomingEvents,
}: PremiumFanDashboardProps) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome banner */}
      <div className="premium-card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-white to-[var(--surface)]" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[var(--gold)]/15 to-transparent" />
        <div className="relative">
          <p className="text-xs font-medium text-[var(--gold-dark)]">ファンダッシュボード</p>
          <h1 className="ja-heading mt-1 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            ようこそ、{userName}さん
          </h1>
          <p className="ja-body mt-2 max-w-lg text-sm text-[var(--text-muted)]">
            推しの選手を応援して、限定コンテンツやイベントに参加しましょう
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/points/purchase" className="btn-gold rounded-full px-5 py-2.5 text-sm">
              ポイント購入
            </Link>
            <Link
              href="/fan/gifts"
              className="btn-gold-outline rounded-full px-5 py-2.5 text-sm"
            >
              ギフトを送る
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="ポイント残高"
          value={formatPoints(pointBalance)}
          sub="ギフト送信に利用"
          highlight
        />
        <StatCard label="ギフト送信" value={`${giftCount}回`} sub="累計回数" />
        <StatCard label="送信合計" value={formatPoints(totalSent)} sub="累計ポイント" />
        <StatCard label="推しの選手" value={`${followingAthletes.length}人`} sub="フォロー中" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <SectionHeader
              title="フォロー中の選手"
              description="最新の投稿やイベントをチェック"
              action={
                <Link
                  href="/following"
                  className="text-sm text-[var(--gold-dark)] hover:underline"
                >
                  すべて見る ›
                </Link>
              }
            />
            {followingAthletes.length === 0 ? (
              <div className="premium-card px-5 py-12 text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  まだフォロー中の選手がいません
                </p>
                <Link href="/search" className="btn-gold mt-4 inline-block rounded-full px-5 py-2 text-sm">
                  選手を探す
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {followingAthletes.slice(0, 6).map((athlete) => (
                  <FollowUserCard
                    key={athlete.id}
                    user={athlete}
                    currentUserId={userId}
                    showMutualBadge
                  />
                ))}
              </div>
            )}
          </section>

          {/* Athletes */}
          <section>
            <SectionHeader
              title="選手一覧"
              description="ギフトを送る選手を選んでください"
              action={
                <Link
                  href="/fan/gifts"
                  className="text-sm text-[var(--gold-dark)] hover:underline"
                >
                  すべて見る ›
                </Link>
              }
            />
            {athletes.length === 0 ? (
              <div className="premium-card px-5 py-12 text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  ギフトを送れるアスリートがまだいません
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {athletes.slice(0, 6).map((athlete) => (
                  <div
                    key={athlete.id}
                    className="premium-card premium-card-hover flex items-center gap-4 p-4"
                  >
                    <ProfileAvatar
                      name={athlete.name}
                      avatarUrl={athlete.avatar_url}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${athlete.id}`}
                        className="font-semibold text-[var(--text-primary)] hover:text-[var(--gold-dark)]"
                      >
                        {athlete.name}
                      </Link>
                      <p className="text-xs text-[var(--text-muted)]">
                        {athlete.sport || "競技未設定"}
                      </p>
                    </div>
                    <Link
                      href={`/gift/send/${athlete.id}`}
                      className="btn-gold shrink-0 rounded-full px-3 py-1.5 text-[10px] sm:text-xs"
                    >
                      ギフト
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Gift history */}
          <section>
            <SectionHeader
              title="ギフト履歴"
              description="最近送ったギフト"
              action={
                <Link
                  href="/fan/gifts"
                  className="text-sm text-[var(--gold-dark)] hover:underline"
                >
                  すべて見る ›
                </Link>
              }
            />
            <div className="premium-card p-4">
              <GiftHistoryList
                gifts={recentGifts}
                mode="sent"
                emptyMessage="まだギフトを送っていません"
                variant="light"
              />
            </div>
          </section>

          {/* Rankings */}
          <section>
            <SectionHeader
              title="ランキング"
              description="今月の応援ランキング"
              action={
                <Link
                  href="/rankings"
                  className="text-sm text-[var(--gold-dark)] hover:underline"
                >
                  すべて見る ›
                </Link>
              }
            />
            <RankingPreviewWidget athletes={rankingAthletes} compact />
          </section>

          {/* Events */}
          <section id="events">
            <SectionHeader
              title="イベント"
              description="参加可能なイベント"
              action={
                <Link
                  href="/events"
                  className="text-sm text-[var(--gold-dark)] hover:underline"
                >
                  すべて見る ›
                </Link>
              }
            />
            <div className="space-y-4">
              <NextEventWidget event={nextEvent} />
              {upcomingEvents.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcomingEvents.slice(0, 4).map((event) => (
                    <EventCard key={event.id} event={event} compact />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        {/* Right column widgets (inline on smaller screens) */}
        <div className="space-y-5">
          <div className="premium-card p-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">クイックアクション</h3>
            <div className="mt-4 space-y-2">
              <Link
                href="/following"
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-4 py-3 text-sm transition-colors hover:border-[var(--gold)]"
              >
                フォロー中の選手
                <span className="text-[var(--text-muted)]">›</span>
              </Link>
              <Link
                href="/events"
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-4 py-3 text-sm transition-colors hover:border-[var(--gold)]"
              >
                イベントを見る
                <span className="text-[var(--text-muted)]">›</span>
              </Link>
              <Link
                href="/rankings"
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-4 py-3 text-sm transition-colors hover:border-[var(--gold)]"
              >
                ランキングを見る
                <span className="text-[var(--text-muted)]">›</span>
              </Link>
              <Link
                href="/feed"
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-4 py-3 text-sm transition-colors hover:border-[var(--gold)]"
              >
                フィードを見る
                <span className="text-[var(--text-muted)]">›</span>
              </Link>
              <Link
                href="/messages"
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-4 py-3 text-sm transition-colors hover:border-[var(--gold)]"
              >
                メッセージ
                <span className="text-[var(--text-muted)]">›</span>
              </Link>
              <Link
                href="/points/purchase"
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-4 py-3 text-sm transition-colors hover:border-[var(--gold)]"
              >
                ポイント購入
                <span className="text-[var(--text-muted)]">›</span>
              </Link>
            </div>
          </div>

          <div className="premium-card bg-gradient-to-br from-[var(--gold)]/10 to-white p-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">限定コンテンツ</h3>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              ギフト支援で選手の限定動画・配信が解放されます
            </p>
            <Link
              href="/fan/gifts"
              className="btn-gold mt-4 block rounded-lg py-2.5 text-center text-xs"
            >
              選手を探す
            </Link>
          </div>

          <RankingPreviewWidget athletes={rankingAthletes} />

        </div>
      </div>
    </div>
  );
}
