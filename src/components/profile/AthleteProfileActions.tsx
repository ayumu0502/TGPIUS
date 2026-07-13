"use client";

import Link from "next/link";
import { useState } from "react";
import FollowButton from "@/components/follows/FollowButton";
import type { PublicProfile } from "@/types/profile";

type AthleteProfileActionsProps = {
  profile: PublicProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  showGiftButton: boolean;
  showMessageButton: boolean;
  showFollowButton: boolean;
  showPurchaseButton: boolean;
  onFollowChange?: (state: { isFollowing: boolean; followerCount?: number }) => void;
};

export default function AthleteProfileActions({
  profile,
  isOwnProfile,
  isFollowing,
  showGiftButton,
  showMessageButton,
  showFollowButton,
  showPurchaseButton,
  onFollowChange,
}: AthleteProfileActionsProps) {
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${profile.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.name} | TGPLUS`,
          text: profile.bio || `${profile.name}のプロフィール`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("リンクをコピーしました");
        setTimeout(() => setShareMessage(null), 2000);
      }
    } catch {
      setShareMessage(null);
    }
  };

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--card-border)] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        {showFollowButton ? (
          <FollowButton
            userId={profile.id}
            initialIsFollowing={isFollowing}
            size="lg"
            variant="light"
            onChange={onFollowChange}
          />
        ) : null}

        {showMessageButton ? (
          <Link
            href={`/messages/start/${profile.id}`}
            className="rounded-full border border-[var(--card-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
          >
            DMを送る
          </Link>
        ) : null}

        {showGiftButton ? (
          <Link href={`/gift/send/${profile.id}`} className="btn-gold rounded-full px-5 py-2.5 text-sm">
            ギフトを送る
          </Link>
        ) : null}

        {showPurchaseButton ? (
          <Link
            href="/points/purchase"
            className="rounded-full border border-[var(--card-border)] px-5 py-2.5 text-sm font-medium text-[var(--gold-dark)] transition-colors hover:bg-[rgba(197,160,89,0.1)]"
          >
            ポイント購入
          </Link>
        ) : null}

        <button
          type="button"
          onClick={handleShare}
          className="rounded-full border border-[var(--card-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)]"
        >
          シェア
        </button>

        {isOwnProfile ? (
          <>
            <Link
              href="/athlete/profile/edit"
              className="rounded-full border border-[var(--card-border)] px-5 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
            >
              プロフィール編集
            </Link>
            <Link
              href="/post/new"
              className="rounded-full border border-[var(--card-border)] px-5 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
            >
              新規投稿
            </Link>
          </>
        ) : null}

        {shareMessage ? (
          <p className="w-full text-xs text-[var(--gold-dark)]">{shareMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
