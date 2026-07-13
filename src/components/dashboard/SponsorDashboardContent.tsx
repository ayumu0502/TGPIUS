import Link from "next/link";
import {
  AthleteAvatar,
  DashboardSection,
  PrimaryButton,
  QuickActionCard,
  SecondaryButton,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/DashboardUI";
import {
  searchableAthletes,
  sponsorCampaigns,
  sponsorContracts,
  sponsorMessages,
} from "@/lib/dashboard/mock-data";

const campaignIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
  </svg>
);

const searchIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const messageIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const billingIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export default function SponsorDashboardContent() {
  const unreadCount = sponsorMessages.filter((m) => m.unread).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="進行中案件" value="2件" sub="アクティブ" highlight />
        <StatCard label="契約中" value={`${sponsorContracts.length}名`} sub="アスリート" />
        <StatCard label="未読メッセージ" value={`${unreadCount}件`} sub="要確認" />
        <StatCard label="今月の支払い" value="¥580,000" sub="請求済み" />
      </div>

      <DashboardSection title="クイックアクション" description="よく使う機能">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="スポンサー案件管理"
            description="案件の作成・進捗・完了管理"
            icon={campaignIcon}
          />
          <QuickActionCard
            title="選手検索"
            description="条件に合うアスリートを探す"
            icon={searchIcon}
          />
          <Link href="/messages" className="premium-action-card">
            <div className="premium-action-icon">{messageIcon}</div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">メッセージ</p>
              <p className="ja-body mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                アスリートとのDM
              </p>
            </div>
          </Link>
          <QuickActionCard
            title="請求・支払い管理"
            description="請求書・支払い履歴の確認"
            icon={billingIcon}
          />
        </div>
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="スポンサー案件管理"
          description="進行中・募集中の案件"
          action={<PrimaryButton>新規案件</PrimaryButton>}
        >
          <div className="space-y-3">
            {sponsorCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="premium-card premium-card-hover flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--text-primary)]">{campaign.title}</p>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    予算 {campaign.budget}
                  </p>
                </div>
                <SecondaryButton className="w-full shrink-0 sm:w-auto">
                  詳細
                </SecondaryButton>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          title="契約中のアスリート"
          description="現在スポンサー契約中の選手"
          action={<SecondaryButton>すべて見る</SecondaryButton>}
        >
          <div className="space-y-3">
            {sponsorContracts.map((contract) => (
              <div
                key={contract.id}
                className="premium-card flex items-center gap-4 p-4"
              >
                <AthleteAvatar initial={contract.athlete.charAt(0)} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-primary)]">{contract.athlete}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {contract.sport} · {contract.period}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    契約額 {contract.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        title="選手検索"
        description="スポンサーに最適なアスリートを見つける"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="名前・競技種目で検索..."
            className="flex-1 rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
          />
          <PrimaryButton className="w-full sm:w-auto">検索</PrimaryButton>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {searchableAthletes.map((athlete) => (
            <div
              key={athlete.id}
              className="premium-card premium-card-hover flex items-center gap-4 p-4"
            >
              <AthleteAvatar initial={athlete.avatarInitial} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--text-primary)]">{athlete.name}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {athlete.sport} · {athlete.followers}
                </p>
              </div>
              <SecondaryButton className="shrink-0 text-xs">
                詳細
              </SecondaryButton>
            </div>
          ))}
        </div>
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="メッセージ"
          description="アスリート・サポートとの連絡"
          action={<SecondaryButton>すべて見る</SecondaryButton>}
        >
          <div className="space-y-2">
            {sponsorMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl border p-4 transition-colors ${
                  message.unread
                    ? "border-[var(--gold)]/30 bg-[rgba(197,160,89,0.06)]"
                    : "premium-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {message.from}
                    {message.unread ? (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[var(--gold)]" />
                    ) : null}
                  </p>
                  <p className="shrink-0 text-xs text-[var(--text-muted)]">
                    {message.time}
                  </p>
                </div>
                <p className="ja-body mt-1 truncate text-sm text-[var(--text-secondary)]">
                  {message.preview}
                </p>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          title="請求・支払い管理"
          description="請求書と支払い履歴"
          action={<PrimaryButton>請求書を発行</PrimaryButton>}
        >
          <div className="space-y-3">
            <div className="premium-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-primary)]">2026年7月分</p>
                <StatusBadge status="進行中" />
              </div>
              <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">¥580,000</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">支払期限：2026/07/31</p>
            </div>
            <div className="premium-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-primary)]">2026年6月分</p>
                <StatusBadge status="完了" />
              </div>
              <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">¥420,000</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">支払済み：2026/06/28</p>
            </div>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
