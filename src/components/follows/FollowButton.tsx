"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions/follows";

type FollowButtonProps = {
  userId: string;
  initialIsFollowing: boolean;
  initialFollowerCount?: number;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  disabled?: boolean;
  onChange?: (state: { isFollowing: boolean; followerCount?: number }) => void;
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-[10px] sm:text-xs",
  md: "px-4 py-2 text-xs sm:text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export default function FollowButton({
  userId,
  initialIsFollowing,
  initialFollowerCount,
  size = "md",
  variant = "light",
  disabled = false,
  onChange,
}: FollowButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [error, setError] = useState<string | null>(null);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || isPending) return;

    const next = !isFollowing;
    setIsFollowing(next);
    setError(null);

    startTransition(async () => {
      const result = await toggleFollow(userId);
      if (result.error) {
        setIsFollowing(!next);
        setError(result.error);
        return;
      }

      const resolvedFollowing = result.isFollowing ?? next;
      setIsFollowing(resolvedFollowing);
      onChange?.({
        isFollowing: resolvedFollowing,
        followerCount: result.followerCount ?? initialFollowerCount,
      });
      router.refresh();
    });
  };

  const followingClass =
    variant === "dark"
      ? "border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--gold)]"
      : "border border-[var(--card-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--gold)]";

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        className={`rounded-full font-medium transition-all duration-200 disabled:opacity-50 ${
          SIZE_CLASSES[size]
        } ${isFollowing ? followingClass : "btn-gold"}`}
      >
        {isFollowing ? "フォロー中" : "フォロー"}
      </button>
      {error ? <span className="mt-1 text-[10px] text-red-500">{error}</span> : null}
    </div>
  );
}
