import Link from "next/link";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { formatPoints } from "@/lib/points/constants";
import type { PublicProfile } from "@/types/profile";
import type { AthleteProfilePageData } from "@/types/profile-page";

type AthleteProfileSidebarProps = {
  profile: PublicProfile;
  pageData: AthleteProfilePageData;
};

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="premium-card p-4">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function AthleteProfileSidebar({
  profile,
  pageData,
}: AthleteProfileSidebarProps) {
  const { stats, recent_gifts, events, exclusive_posts, ranking_entries } = pageData;

  return (
    <div className="space-y-4">
      <SidebarCard title="今月の獲得ポイント">
        <p className="text-2xl font-bold text-[var(--gold-dark)]">
          {formatPoints(stats.monthly_gift_total)}
        </p>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">直近30日間</p>
      </SidebarCard>

      <SidebarCard title="ランキング">
        {stats.rank ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--gold-dark)]">{stats.rank}</span>
            <span className="text-sm text-[var(--text-muted)]">位 / 月間ギフト</span>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">ランキング外</p>
        )}
        <Link
          href="/rankings?category=gifts_month"
          className="mt-2 block text-xs text-[var(--gold-dark)] hover:underline"
        >
          ランキングを見る →
        </Link>
      </SidebarCard>

      <SidebarCard title="最近のギフト">
        {recent_gifts.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">まだギフトがありません</p>
        ) : (
          <ul className="space-y-2">
            {recent_gifts.slice(0, 4).map((gift) => (
              <li
                key={gift.id}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-[var(--text-secondary)]">{gift.sender_name}</span>
                  <span className="shrink-0 text-xs font-semibold text-[var(--gold-dark)]">
                    {formatPoints(gift.amount)}
                  </span>
                </div>
                {gift.message ? (
                  <p className="mt-1 line-clamp-1 text-[10px] text-[var(--text-muted)]">{gift.message}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SidebarCard>

      <SidebarCard title="限定動画">
        {exclusive_posts.filter((post) => post.post_type === "video").length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">限定動画は準備中です</p>
        ) : (
          <ul className="space-y-2">
            {exclusive_posts
              .filter((post) => post.post_type === "video")
              .slice(0, 2)
              .map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/fanclub/${profile.id}`}
                    className="block rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]/50"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
          </ul>
        )}
        {pageData.has_fanclub ? (
          <Link
            href={`/fanclub/${profile.id}`}
            className="mt-2 block text-xs text-[var(--gold-dark)] hover:underline"
          >
            ファンクラブへ →
          </Link>
        ) : null}
      </SidebarCard>

      <SidebarCard title="イベント">
        {events.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">予定なし</p>
        ) : (
          <ul className="space-y-2">
            {events.slice(0, 3).map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 transition-colors hover:border-[var(--gold)]/50"
                >
                  <p className="text-xs font-medium text-[var(--text-primary)]">{event.title}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    {new Date(event.starts_at).toLocaleDateString("ja-JP")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SidebarCard>

      <SidebarCard title="スポンサー">
        <div className="space-y-2">
          {ranking_entries.slice(0, 2).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2"
            >
              <ProfileAvatar name={entry.name} avatarUrl={entry.avatar_url} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--text-secondary)]">Official Partner</p>
                <p className="truncate text-[10px] text-[var(--text-muted)]">{entry.name}</p>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-[var(--text-muted)]">
            スポンサーシップの詳細はお問い合わせください
          </p>
        </div>
      </SidebarCard>
    </div>
  );
}
