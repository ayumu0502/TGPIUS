import Link from "next/link";
import {
  DashboardSection,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/DashboardUI";
import GiftHistoryList from "@/components/gifts/GiftHistoryList";
import { CreatedEventsWidget } from "@/components/events/NextEventWidget";
import { athletePosts } from "@/lib/dashboard/mock-data";
import { formatPoints } from "@/lib/gifts/constants";
import type { GiftRecord } from "@/types/gifts";
import type { EventSummary } from "@/types/events";

const editIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
  </svg>
);

const postIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const giftIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const revenueIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

type AthleteDashboardContentProps = {
  totalReceived: number;
  giftCount: number;
  recentGifts: GiftRecord[];
  createdEvents: EventSummary[];
};

export default function AthleteDashboardContent({
  totalReceived,
  giftCount,
  recentGifts,
  createdEvents,
}: AthleteDashboardContentProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="受取合計" value={formatPoints(totalReceived)} sub="累計ポイント" highlight />
        <StatCard label="ギフト受取" value={`${giftCount}件`} sub="ファンからの応援" />
        <StatCard label="今月の売上" value="¥48,500" sub="手数料控除前" />
        <StatCard label="出金可能額" value="¥32,000" sub="最低出金額 ¥5,000" />
      </div>

      <DashboardSection title="クイックアクション" description="よく使う機能">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/athlete/profile/edit" className="premium-action-card">
            <div className="premium-action-icon">{editIcon}</div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">プロフィール編集</p>
              <p className="ja-body mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                自己紹介・競技情報・SNSリンクを更新
              </p>
            </div>
          </Link>
          <Link href="/post/new" className="premium-action-card">
            <div className="premium-action-icon">{postIcon}</div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">投稿管理</p>
              <p className="ja-body mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                新規投稿の作成・公開・管理
              </p>
            </div>
          </Link>
          <Link href="/athlete/gifts" className="premium-action-card">
            <div className="premium-action-icon">{giftIcon}</div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">ギフト受取履歴</p>
              <p className="ja-body mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                ファンから届いた応援ギフトを確認
              </p>
            </div>
          </Link>
          <Link href="/events/create" className="premium-action-card">
            <div className="premium-action-icon">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">イベント作成</p>
              <p className="ja-body mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                ファンミーティングやオンラインイベントを公開
              </p>
            </div>
          </Link>
          <Link href="/messages" className="premium-action-card">
            <div className="premium-action-icon">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">メッセージ</p>
              <p className="ja-body mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                ファン・スポンサーとのDM
              </p>
            </div>
          </Link>
        </div>
      </DashboardSection>

      <DashboardSection
        title="作成イベント"
        description="公開中のイベント"
        action={
          <Link href="/events/my">
            <SecondaryButton>すべて見る</SecondaryButton>
          </Link>
        }
      >
        <CreatedEventsWidget events={createdEvents} />
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="投稿管理"
          description="最近の投稿"
          action={
            <Link href="/post/new">
              <PrimaryButton>新規投稿</PrimaryButton>
            </Link>
          }
        >
          <div className="space-y-3">
            {athletePosts.map((post) => (
              <div
                key={post.id}
                className="premium-card flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">{post.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{post.date}</p>
                </div>
                <StatusBadge status={post.status} />
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          title="ギフト受取履歴"
          description="ファンから届いたギフト"
          action={
            <Link href="/athlete/gifts">
              <SecondaryButton>すべて見る</SecondaryButton>
            </Link>
          }
        >
          <GiftHistoryList
            gifts={recentGifts}
            mode="received"
            emptyMessage="まだギフトは届いていません"
          />
        </DashboardSection>
      </div>

      <DashboardSection
        title="売上・収益管理"
        description="月次の収益サマリー"
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryButton>レポート出力</SecondaryButton>
            <PrimaryButton>出金申請</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="premium-card p-4">
            <p className="text-xs text-[var(--text-muted)]">ギフト収益</p>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{formatPoints(totalReceived)}</p>
          </div>
          <div className="premium-card p-4">
            <p className="text-xs text-[var(--text-muted)]">スポンサー収益</p>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">¥20,000</p>
          </div>
          <div className="premium-card p-4">
            <p className="text-xs text-[var(--text-muted)]">合計（今月）</p>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">¥48,500</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4">
          <div className="premium-action-icon">{revenueIcon}</div>
          <p className="ja-body text-sm text-[var(--text-secondary)]">
            出金申請は毎月5日・20日に処理されます。最低出金額は ¥5,000 です。
          </p>
        </div>
      </DashboardSection>
    </div>
  );
}
