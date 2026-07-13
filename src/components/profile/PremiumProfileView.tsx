import Link from "next/link";
import PostCard from "@/components/social/PostCard";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import type { PostWithMeta } from "@/types/posts";
import type { PublicProfile } from "@/types/profile";

type PremiumProfileViewProps = {
  profile: PublicProfile;
  posts: PostWithMeta[];
  isOwnProfile: boolean;
  showGiftButton?: boolean;
  showMessageButton?: boolean;
};

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] sm:text-xs">{label}</p>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function PremiumProfileView({
  profile,
  posts,
  isOwnProfile,
  showGiftButton = false,
  showMessageButton = false,
}: PremiumProfileViewProps) {
  const isAthlete = profile.account_type === "athlete";

  return (
    <div>
      {/* Hero */}
      <div className="premium-hero-banner relative h-48 sm:h-64 lg:h-72">
        <div className="premium-hero-overlay absolute inset-0" />

        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-4 pb-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="-mb-2 rounded-full ring-4 ring-[var(--gold)] ring-offset-2 ring-offset-white sm:-mb-4">
              <ProfileAvatar
                name={profile.name}
                avatarUrl={profile.avatar_url}
                size="lg"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                  {profile.name}
                </h1>
                {isAthlete && profile.sport ? (
                  <span className="badge-gold rounded-full px-3 py-1 text-xs font-medium">
                    {profile.sport}
                  </span>
                ) : (
                  <span className="badge-gold rounded-full px-3 py-1 text-xs font-medium">
                    {profile.account_type === "fan"
                      ? "ファン"
                      : profile.account_type === "sponsor"
                        ? "スポンサー"
                        : "アスリート"}
                  </span>
                )}
              </div>
              {isAthlete ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {[profile.team, profile.region].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {profile.bio ? (
                <p className="ja-body mt-2 line-clamp-2 max-w-xl text-sm text-[var(--text-muted)]">
                  {profile.bio}
                </p>
              ) : null}
            </div>

            <div className="flex gap-6 sm:gap-8">
              <StatPill label="投稿" value={String(profile.post_count)} />
              {isAthlete ? (
                <>
                  <StatPill label="応援" value="—" />
                  <StatPill label="ギフト" value="—" />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-b border-[var(--card-border)] bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-2">
          {showGiftButton ? (
            <Link
              href={`/gift/send/${profile.id}`}
              className="btn-gold rounded-full px-6 py-2.5 text-sm"
            >
              ギフトを送る
            </Link>
          ) : null}
          {showMessageButton ? (
            <Link
              href={`/messages/start/${profile.id}`}
              className="rounded-full border border-[var(--card-border)] bg-white px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
            >
              メッセージ
            </Link>
          ) : null}
          {isOwnProfile && isAthlete ? (
            <Link
              href="/athlete/profile/edit"
              className="rounded-full border border-[var(--card-border)] px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]"
            >
              プロフィール編集
            </Link>
          ) : null}
          {isOwnProfile ? (
            <Link
              href="/post/new"
              className="rounded-full border border-[var(--card-border)] px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]"
            >
              新規投稿
            </Link>
          ) : null}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - posts */}
          <div className="lg:col-span-2">
            {isAthlete && (profile.achievements || profile.goals) ? (
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
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

            <div className="premium-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-4">
                <h2 className="text-base font-bold text-[var(--text-primary)]">投稿フィード</h2>
                <span className="text-xs text-[var(--text-muted)]">{posts.length}件</span>
              </div>

              {posts.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <p className="text-[var(--text-muted)]">まだ投稿がありません</p>
                  {isOwnProfile ? (
                    <Link
                      href="/post/new"
                      className="btn-gold mt-4 inline-block rounded-full px-6 py-2.5 text-sm"
                    >
                      最初の投稿を作成
                    </Link>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-0.5 p-0.5 sm:hidden">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/feed#post-${post.id}`}
                        className="relative aspect-square bg-zinc-100"
                      >
                        {post.media_type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.media_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="relative h-full w-full bg-zinc-200">
                            <video
                              src={post.media_url}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                              動画
                            </div>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>

                  <div className="hidden divide-y divide-[var(--card-border)] sm:block">
                    {posts.map((post) => (
                      <div key={post.id} id={`post-${post.id}`} className="bg-white">
                        <PostCard post={post} variant="light" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right column - profile info */}
          <div className="space-y-5">
            {isAthlete ? (
              <InfoCard title="選手情報">
                <dl className="space-y-3 text-sm">
                  {profile.team ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--text-muted)]">所属</dt>
                      <dd className="font-medium text-[var(--text-primary)]">{profile.team}</dd>
                    </div>
                  ) : null}
                  {profile.region ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--text-muted)]">地域</dt>
                      <dd className="font-medium text-[var(--text-primary)]">{profile.region}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-2">
                    <dt className="text-[var(--text-muted)]">登録日</dt>
                    <dd className="font-medium text-[var(--text-primary)]">
                      {new Date(profile.created_at).toLocaleDateString("ja-JP")}
                    </dd>
                  </div>
                </dl>
              </InfoCard>
            ) : null}

            {(profile.instagram_url || profile.tiktok_url || profile.x_url) ? (
              <InfoCard title="SNS">
                <div className="space-y-2">
                  {profile.instagram_url ? (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--gold)]"
                    >
                      Instagram
                      <span className="text-[var(--text-muted)]">↗</span>
                    </a>
                  ) : null}
                  {profile.tiktok_url ? (
                    <a
                      href={profile.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--gold)]"
                    >
                      TikTok
                      <span className="text-[var(--text-muted)]">↗</span>
                    </a>
                  ) : null}
                  {profile.x_url ? (
                    <a
                      href={profile.x_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--gold)]"
                    >
                      X
                      <span className="text-[var(--text-muted)]">↗</span>
                    </a>
                  ) : null}
                </div>
              </InfoCard>
            ) : null}

            {isAthlete && showGiftButton ? (
              <div className="premium-card bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-5">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  応援ギフトを送る
                </h3>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  ポイントでギフトを送り、選手の挑戦を支えましょう
                </p>
                <Link
                  href={`/gift/send/${profile.id}`}
                  className="btn-gold mt-4 block rounded-lg py-2.5 text-center text-sm"
                >
                  ギフトを送る
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
