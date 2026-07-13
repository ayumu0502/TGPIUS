import Link from "next/link";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { formatPoints } from "@/lib/points/constants";
import type { PublicProfile } from "@/types/profile";
import type { AthleteProfileStats } from "@/types/profile-page";

type AthleteProfileHeaderProps = {
  profile: PublicProfile;
  stats: AthleteProfileStats;
  followerCount?: number;
};

function VerifiedBadge() {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gold)] text-white"
      title="認証済みアスリート"
      aria-label="認証済み"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
    </span>
  );
}

function StatLink({
  href,
  label,
  value,
  highlight,
}: {
  href?: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const content = (
    <>
      <p
        className={`text-lg font-bold sm:text-xl ${
          highlight ? "text-[var(--gold-dark)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] text-[var(--text-muted)] sm:text-xs">{label}</p>
    </>
  );

  if (!href) {
    return <div className="text-center">{content}</div>;
  }

  return (
    <Link href={href} className="text-center transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-all hover:border-[var(--gold)] hover:bg-[rgba(197,160,89,0.1)] hover:text-[var(--gold-dark)]"
    >
      {icon}
    </a>
  );
}

export default function AthleteProfileHeader({
  profile,
  stats,
  followerCount,
}: AthleteProfileHeaderProps) {
  const coverImage = profile.cover_url || profile.avatar_url;
  const showVerified = profile.is_verified || stats.gift_total > 0;
  const displayFollowerCount = followerCount ?? stats.follower_count;

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-52 sm:h-64 lg:h-80">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface)] via-white to-[var(--gold)]/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent" />
      </div>

      <div className="relative -mt-20 px-4 pb-6 sm:-mt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="animate-fade-in-up shrink-0">
              <div className="inline-block rounded-full ring-4 ring-[var(--gold)] ring-offset-4 ring-offset-white">
                <ProfileAvatar
                  name={profile.name}
                  avatarUrl={profile.avatar_url}
                  size="lg"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 animate-fade-in-up animate-delay-100">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
                  {profile.name}
                </h1>
                {showVerified ? <VerifiedBadge /> : null}
                {profile.sport ? (
                  <span className="badge-gold rounded-full px-3 py-1 text-xs font-medium">
                    {profile.sport}
                  </span>
                ) : null}
              </div>

              {profile.team ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{profile.team}</p>
              ) : null}

              {profile.region ? (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{profile.region}</p>
              ) : null}

              {profile.bio ? (
                <p className="ja-body mt-3 line-clamp-3 max-w-2xl text-sm text-[var(--text-secondary)] sm:line-clamp-none">
                  {profile.bio}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {profile.instagram_url ? (
                  <SocialLink
                    href={profile.instagram_url}
                    label="Instagram"
                    icon={
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    }
                  />
                ) : null}
                {profile.x_url ? (
                  <SocialLink
                    href={profile.x_url}
                    label="X"
                    icon={
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    }
                  />
                ) : null}
                {profile.tiktok_url ? (
                  <SocialLink
                    href={profile.tiktok_url}
                    label="TikTok"
                    icon={
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                      </svg>
                    }
                  />
                ) : null}
                {profile.youtube_url ? (
                  <SocialLink
                    href={profile.youtube_url}
                    label="YouTube"
                    icon={
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    }
                  />
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-5 sm:gap-6 animate-fade-in-up animate-delay-200">
              <StatLink
                href={`/followers/${profile.id}`}
                label="フォロワー"
                value={displayFollowerCount.toLocaleString("ja-JP")}
              />
              <StatLink
                label="総ギフト"
                value={formatPoints(stats.gift_total)}
                highlight
              />
              <StatLink
                label="ランキング"
                value={stats.rank ? `${stats.rank}位` : "—"}
              />
              <StatLink label="投稿" value={String(profile.post_count)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
