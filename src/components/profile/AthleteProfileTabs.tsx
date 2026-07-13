"use client";

import Link from "next/link";
import PostCard from "@/components/social/PostCard";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { ProfileEmptyState } from "@/components/profile/ProfileStates";
import { formatPoints } from "@/lib/points/constants";
import type { EventSummary } from "@/types/events";
import type { FanclubPost } from "@/types/fanclub";
import type { PostWithMeta } from "@/types/posts";
import type { PublicProfile } from "@/types/profile";
import type { AthleteProfilePageData } from "@/types/profile-page";
import type { AthleteRankingEntry } from "@/types/rankings";

export type ProfileTabId =
  | "home"
  | "posts"
  | "exclusive"
  | "events"
  | "ranking"
  | "gallery";

export const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: "home", label: "ホーム" },
  { id: "posts", label: "投稿" },
  { id: "exclusive", label: "限定コンテンツ" },
  { id: "events", label: "イベント" },
  { id: "ranking", label: "応援ランキング" },
  { id: "gallery", label: "ギャラリー" },
];

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5 transition-all duration-300 hover:shadow-lg">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function AthleteProfileHomeTab({
  profile,
  pageData,
  posts,
  isOwnProfile,
}: {
  profile: PublicProfile;
  pageData: AthleteProfilePageData;
  posts: PostWithMeta[];
  isOwnProfile: boolean;
}) {
  const recentPosts = posts.slice(0, 3);

  return (
    <div className="space-y-5 animate-fade-in">
      {(profile.achievements || profile.goals) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.achievements ? (
            <InfoCard title="実績">
              <p className="ja-body whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                {profile.achievements}
              </p>
            </InfoCard>
          ) : null}
          {profile.goals ? (
            <InfoCard title="目標">
              <p className="ja-body whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                {profile.goals}
              </p>
            </InfoCard>
          ) : null}
        </div>
      ) : null}

      <InfoCard title="今月の獲得ポイント">
        <p className="text-3xl font-bold text-[var(--gold-dark)]">
          {formatPoints(pageData.stats.monthly_gift_total)}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">直近30日間のギフト合計</p>
      </InfoCard>

      <InfoCard title="最近の投稿">
        {recentPosts.length === 0 ? (
          <ProfileEmptyState
            title="投稿がありません"
            description="最初の投稿をお待ちしています"
            action={
              isOwnProfile ? (
                <Link href="/post/new" className="btn-gold rounded-full px-5 py-2 text-sm">
                  投稿を作成
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`#post-${post.id}`}
                className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100"
              >
                {post.media_type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.media_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <video src={post.media_url} className="h-full w-full object-cover" />
                )}
              </Link>
            ))}
          </div>
        )}
      </InfoCard>
    </div>
  );
}

export function AthleteProfilePostsTab({
  posts,
  isOwnProfile,
}: {
  posts: PostWithMeta[];
  isOwnProfile: boolean;
}) {
  if (posts.length === 0) {
    return (
      <ProfileEmptyState
        title="まだ投稿がありません"
        description="写真や動画をシェアしてファンとつながりましょう"
        action={
          isOwnProfile ? (
            <Link href="/post/new" className="btn-gold rounded-full px-6 py-2.5 text-sm">
              最初の投稿を作成
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {posts.map((post) => (
        <div key={post.id} id={`post-${post.id}`} className="glass-card overflow-hidden">
          <PostCard post={post} variant="light" showShare showSave />
        </div>
      ))}
    </div>
  );
}

export function AthleteProfileExclusiveTab({
  athleteId,
  posts,
  hasFanclub,
}: {
  athleteId: string;
  posts: FanclubPost[];
  hasFanclub: boolean;
}) {
  if (posts.length === 0) {
    return (
      <ProfileEmptyState
        title="限定コンテンツはありません"
        description={
          hasFanclub
            ? "ファンクラブに加入すると限定コンテンツが閲覧できます"
            : "このアスリートの限定コンテンツは準備中です"
        }
        action={
          hasFanclub ? (
            <Link href={`/fanclub/${athleteId}`} className="btn-gold rounded-full px-6 py-2.5 text-sm">
              ファンクラブを見る
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 animate-fade-in">
      {posts.map((post) => (
        <div key={post.id} className="glass-card overflow-hidden">
          {post.media_url ? (
            post.post_type === "video" ? (
              <video
                src={post.media_url}
                controls
                playsInline
                className="aspect-video w-full bg-black object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.media_url}
                alt={post.title}
                className="aspect-video w-full object-cover"
              />
            )
          ) : (
            <div className="flex aspect-video items-center justify-center bg-zinc-100 text-zinc-400">
              限定コンテンツ
            </div>
          )}
          <div className="p-4">
            <span className="badge-gold rounded px-2 py-0.5 text-[10px]">メンバー限定</span>
            <h4 className="mt-2 font-semibold text-[var(--text-primary)]">{post.title}</h4>
            {post.content ? (
              <p className="ja-body mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                {post.content}
              </p>
            ) : null}
          </div>
        </div>
      ))}
      <Link
        href={`/fanclub/${athleteId}`}
        className="glass-card flex items-center justify-center p-6 text-sm font-medium text-[var(--gold-dark)] transition-colors hover:text-[var(--gold)]"
      >
        すべての限定コンテンツを見る →
      </Link>
    </div>
  );
}

export function AthleteProfileEventsTab({
  events,
  athleteId,
}: {
  events: EventSummary[];
  athleteId: string;
}) {
  if (events.length === 0) {
    return (
      <ProfileEmptyState
        title="予定されているイベントはありません"
        description="新しいイベントが追加されるまでお待ちください"
        action={
          <Link href="/events" className="btn-gold-outline rounded-full px-5 py-2 text-sm">
            イベント一覧
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          className="glass-card block p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">{event.title}</h4>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {new Date(event.starts_at).toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {event.venue_name ? ` · ${event.venue_name}` : ""}
              </p>
            </div>
            <span className="badge-gold shrink-0 rounded px-2 py-1 text-[10px]">
              {event.fee_points > 0 ? `${event.fee_points} pt` : "無料"}
            </span>
          </div>
        </Link>
      ))}
      <Link
        href={`/events?creator=${athleteId}`}
        className="block text-center text-sm text-[var(--gold-dark)] hover:underline"
      >
        すべてのイベントを見る
      </Link>
    </div>
  );
}

export function AthleteProfileRankingTab({
  entries,
  athleteId,
}: {
  entries: AthleteRankingEntry[];
  athleteId: string;
}) {
  const athleteEntry = entries.find((entry) => entry.id === athleteId);

  return (
    <div className="space-y-5 animate-fade-in">
      {athleteEntry ? (
        <div className="glass-card bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-5">
          <p className="text-xs text-[var(--text-muted)]">今月の順位</p>
          <p className="mt-1 text-4xl font-bold text-[var(--gold-dark)]">
            {athleteEntry.rank}位
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            スコア {formatPoints(athleteEntry.score)}
          </p>
        </div>
      ) : null}

      <div className="glass-card overflow-hidden">
        <div className="border-b border-[var(--card-border)] px-5 py-3">
          <h3 className="text-sm font-bold">月間応援ランキング TOP10</h3>
        </div>
        <ul className="divide-y divide-[var(--card-border)]">
          {entries.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
              ランキングデータがありません
            </li>
          ) : (
            entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/profile/${entry.id}`}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50 ${
                    entry.id === athleteId ? "bg-[var(--gold)]/5" : ""
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      entry.rank <= 3
                        ? "bg-[var(--gold)] text-[var(--sidebar)]"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <ProfileAvatar name={entry.name} avatarUrl={entry.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{entry.sport}</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--gold-dark)]">
                    {formatPoints(entry.score)}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
        <Link
          href="/rankings?category=gifts_month"
          className="block border-t border-[var(--card-border)] py-3 text-center text-xs text-[var(--gold-dark)] hover:underline"
        >
          ランキング一覧へ
        </Link>
      </div>
    </div>
  );
}

export function AthleteProfileGalleryTab({ posts }: { posts: PostWithMeta[] }) {
  const images = posts.filter((post) => post.media_type === "image");

  if (images.length === 0) {
    return (
      <ProfileEmptyState
        title="ギャラリーは空です"
        description="画像投稿が追加されるとここに表示されます"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4 animate-fade-in">
      {images.map((post) => (
        <Link
          key={post.id}
          href={`#post-${post.id}`}
          className="group relative aspect-square overflow-hidden bg-zinc-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.media_url}
            alt={post.caption || "ギャラリー画像"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
        </Link>
      ))}
    </div>
  );
}
