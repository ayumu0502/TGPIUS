import Link from "next/link";
import {
  DashboardSection,
  SecondaryButton,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/DashboardUI";
import GiftHistoryList from "@/components/gifts/GiftHistoryList";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { fanEvents } from "@/lib/dashboard/mock-data";
import { formatPoints } from "@/lib/gifts/constants";
import type { GiftAthleteSummary, GiftRecord } from "@/types/gifts";

type FanDashboardContentProps = {
  pointBalance: number;
  giftCount: number;
  totalSent: number;
  athletes: GiftAthleteSummary[];
  recentGifts: GiftRecord[];
};

export default function FanDashboardContent({
  pointBalance,
  giftCount,
  totalSent,
  athletes,
  recentGifts,
}: FanDashboardContentProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="ポイント残高"
          value={formatPoints(pointBalance)}
          sub="テスト用ポイント"
          highlight
        />
        <StatCard
          label="送信回数"
          value={`${giftCount}回`}
          sub="ギフト送信"
        />
        <StatCard label="送信合計" value={formatPoints(totalSent)} sub="累計" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/points/purchase"
          className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          ポイント購入
        </Link>
        <Link
          href="/fan/gifts"
          className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
        >
          ギフトを送る
        </Link>
        <Link
          href="/messages"
          className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
        >
          メッセージ
        </Link>
      </div>

      <DashboardSection
        title="アスリート一覧"
        description="ギフトを送る選手を選んでください"
        action={
          <Link
            href="/fan/gifts"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
          >
            すべて見る
          </Link>
        }
      >
        {athletes.length === 0 ? (
          <p className="text-sm text-zinc-500">
            ギフトを送れるアスリートがまだいません
          </p>
        ) : (
          <div className="space-y-3">
            {athletes.slice(0, 4).map((athlete) => (
              <div
                key={athlete.id}
                className="card-hover flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 p-4"
              >
                <ProfileAvatar
                  name={athlete.name}
                  avatarUrl={athlete.avatar_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{athlete.name}</p>
                  <p className="text-sm text-zinc-500">
                    {athlete.sport || "競技未設定"}
                  </p>
                </div>
                <Link
                  href={`/gift/send/${athlete.id}`}
                  className="hidden shrink-0 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 sm:inline-flex"
                >
                  ギフトを送る
                </Link>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 text-center sm:p-8">
        <p className="text-lg font-bold sm:text-xl">
          想いをポイントギフトで届けよう
        </p>
        <p className="ja-body mx-auto mt-2 max-w-md text-sm text-zinc-400">
          推しの選手へ、メッセージ付きギフトを送って応援できます
        </p>
        <Link
          href="/fan/gifts"
          className="mt-6 inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          ギフトを送る
        </Link>
      </div>

      <DashboardSection
        title="送信履歴"
        description="最近送ったギフト"
        action={
          <Link
            href="/fan/gifts"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
          >
            すべて見る
          </Link>
        }
      >
        <GiftHistoryList
          gifts={recentGifts}
          mode="sent"
          emptyMessage="まだギフトを送っていません"
        />
      </DashboardSection>

      <DashboardSection
        title="イベント一覧"
        description="参加可能なイベント"
        action={<SecondaryButton>すべて見る</SecondaryButton>}
      >
        <div className="space-y-3">
          {fanEvents.map((event) => (
            <div
              key={event.id}
              className="card-hover flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{event.title}</p>
                  <StatusBadge status={event.status} />
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {event.date} · {event.type}
                </p>
              </div>
              {event.status === "受付中" ? (
                <Link
                  href="#"
                  className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black sm:w-auto"
                >
                  参加する
                </Link>
              ) : (
                <SecondaryButton className="w-full shrink-0 sm:w-auto">
                  詳細を見る
                </SecondaryButton>
              )}
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
