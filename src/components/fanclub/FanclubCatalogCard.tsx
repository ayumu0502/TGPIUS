import Link from "next/link";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import { formatYen } from "@/lib/fanclub/constants";
import type { FanclubCatalogItem } from "@/types/fanclub";

export default function FanclubCatalogCard({ item }: { item: FanclubCatalogItem }) {
  return (
    <Link
      href={`/fanclub/${item.athlete_id}`}
      className="premium-card premium-card-hover flex gap-4 p-5"
    >
      <ProfileAvatar
        name={item.athlete_name}
        avatarUrl={item.athlete_avatar_url}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--text-primary)]">{item.athlete_name}</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {item.athlete_sport || "競技未設定"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[var(--gold)]/10 px-2.5 py-1 text-[var(--gold-dark)]">
            {item.plan_count}プラン
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[var(--text-secondary)]">
            会員 {item.member_count}人
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[var(--text-secondary)]">
            {formatYen(item.min_price_yen)}〜
          </span>
        </div>
      </div>
    </Link>
  );
}
