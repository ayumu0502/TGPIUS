import Link from "next/link";
import PostCard from "@/components/social/PostCard";
import {
  AccountBadge,
  ProfileAvatar,
} from "@/components/social/SocialLayout";
import type { PostWithMeta } from "@/types/posts";
import type { PublicProfile } from "@/types/profile";

type ProfileViewProps = {
  profile: PublicProfile;
  posts: PostWithMeta[];
  isOwnProfile: boolean;
  showGiftButton?: boolean;
  showMessageButton?: boolean;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 border-b border-[var(--card-border)] py-3 last:border-0">
      <span className="w-20 shrink-0 text-xs text-[var(--text-muted)]">{label}</span>
      <span className="ja-body flex-1 text-sm text-[var(--text-secondary)]">{value}</span>
    </div>
  );
}

function TextSection({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <div className="premium-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {title}
      </h3>
      <p className="ja-body mt-3 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
        {content}
      </p>
    </div>
  );
}

function SocialLink({
  label,
  url,
}: {
  label: string;
  url: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--gold)]"
    >
      <span className="font-medium">{label}</span>
      <svg
        className="ml-auto h-4 w-4 text-[var(--text-muted)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </a>
  );
}

export default function ProfileView({
  profile,
  posts,
  isOwnProfile,
  showGiftButton = false,
  showMessageButton = false,
}: ProfileViewProps) {
  const isAthlete = profile.account_type === "athlete";

  return (
    <div>
      <div className="border-b border-[var(--card-border)] bg-white px-4 py-8">
        <div className="flex items-start gap-5">
          <ProfileAvatar
            name={profile.name}
            avatarUrl={profile.avatar_url}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{profile.name}</h1>
            {isAthlete && profile.sport ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{profile.sport}</p>
            ) : null}
            <div className="mt-2">
              <AccountBadge accountType={profile.account_type} />
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="font-bold text-[var(--text-primary)]">{profile.post_count}</span>
                <span className="ml-1 text-[var(--text-muted)]">投稿</span>
              </div>
            </div>
          </div>
        </div>

        {isAthlete ? (
          <div className="premium-card mt-6 px-4">
            <InfoRow label="所属" value={profile.team} />
            <InfoRow label="地域" value={profile.region} />
          </div>
        ) : null}

        {isAthlete && profile.bio ? (
          <p className="ja-body mt-4 text-sm text-[var(--text-secondary)]">{profile.bio}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {showMessageButton ? (
            <Link
              href={`/messages/start/${profile.id}`}
              className="flex-1 rounded-xl border border-[var(--card-border)] py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]"
            >
              メッセージ
            </Link>
          ) : null}
          {showGiftButton ? (
            <Link
              href={`/gift/send/${profile.id}`}
              className="btn-gold flex-1 rounded-xl py-2.5 text-center text-sm"
            >
              ギフトを送る
            </Link>
          ) : null}
          {isOwnProfile && isAthlete ? (
            <Link
              href="/athlete/profile/edit"
              className="flex-1 rounded-xl border border-[var(--card-border)] py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]"
            >
              プロフィール編集
            </Link>
          ) : null}
          {isOwnProfile ? (
            <Link
              href="/post/new"
              className="flex-1 rounded-xl border border-[var(--card-border)] py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]"
            >
              新規投稿
            </Link>
          ) : null}
        </div>
      </div>

      {isAthlete ? (
        <div className="space-y-4 px-4 py-6">
          <TextSection title="実績" content={profile.achievements} />
          <TextSection title="目標" content={profile.goals} />

          {(profile.instagram_url ||
            profile.tiktok_url ||
            profile.x_url) && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                SNS
              </h3>
              <div className="space-y-2">
                <SocialLink label="Instagram" url={profile.instagram_url} />
                <SocialLink label="TikTok" url={profile.tiktok_url} />
                <SocialLink label="X" url={profile.x_url} />
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="border-t border-[var(--card-border)] bg-white">
        <h2 className="px-4 py-4 text-sm font-semibold text-[var(--text-secondary)]">投稿</h2>

        {posts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[var(--text-muted)]">まだ投稿がありません</p>
            {isOwnProfile ? (
              <Link
                href="/post/new"
                className="mt-4 inline-block text-sm font-semibold text-[var(--gold-dark)] underline-offset-4 hover:underline"
              >
                最初の投稿を作成
              </Link>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-0.5">
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
                    <div className="relative h-full w-full">
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

            <div className="mt-6 hidden sm:block">
              {posts.map((post) => (
                <div key={post.id} id={`post-${post.id}`} className="border-b border-[var(--card-border)]">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
