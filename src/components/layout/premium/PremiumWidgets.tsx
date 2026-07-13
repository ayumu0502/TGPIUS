import Link from "next/link";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import RankingPreviewWidget from "@/components/rankings/RankingPreviewWidget";
import { recommendedAthletes } from "@/lib/dashboard/mock-data";
import { IconLock } from "@/components/layout/premium/PremiumIcons";
import type { RankingPreviewAthlete } from "@/types/rankings";

export function PremiumOnlineUsers() {
  return (
    <div className="premium-card p-4">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">オンラインユーザー</h3>
      <ul className="mt-3 space-y-3">
        {recommendedAthletes.slice(0, 4).map((user) => (
          <li key={user.id} className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                {user.avatarInitial}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {user.name}
              </p>
              <span className="badge-gold inline-block rounded px-1.5 py-0.5 text-[10px]">
                {user.sport}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-3 w-full text-center text-xs text-[var(--gold-dark)] hover:underline"
      >
        すべて見る ›
      </button>
    </div>
  );
}

export function PremiumSupportRanking({
  athletes,
}: {
  athletes: RankingPreviewAthlete[];
}) {
  return (
    <RankingPreviewWidget
      athletes={athletes}
      title="応援ランキング"
      description="月間ギフト支援額トップ"
      href="/rankings?category=gifts_month"
    />
  );
}

export function PremiumLimitedContent() {
  const items = [
    { title: "トレーニング動画", desc: "非公開の練習風景" },
    { title: "メンバー限定配信", desc: "月1回のライブトーク" },
    { title: "サイン入り写真", desc: "ギフト支援者限定" },
  ];

  return (
    <div className="premium-card p-4">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">限定コンテンツ</h3>
      <p className="mt-1 text-xs text-[var(--text-muted)]">ギフト支援で解放</p>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-zinc-50 p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-500">
              <IconLock className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/points/purchase"
        className="btn-gold mt-4 block rounded-lg py-2.5 text-center text-xs"
      >
        ポイントを購入して解放
      </Link>
    </div>
  );
}

export function PremiumPromoCard() {
  return (
    <div className="premium-card relative overflow-hidden p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/10 to-transparent" />
      <div className="relative">
        <p className="text-sm font-bold leading-relaxed text-[var(--text-primary)]">
          あなたの力で、
          <br />
          選手の挑戦を支えよう
        </p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          ギフトと応援メッセージで選手を後押し
        </p>
        <Link
          href="/fan/gifts"
          className="btn-gold mt-4 inline-block rounded-lg px-5 py-2 text-xs"
        >
          選手一覧を見る
        </Link>
      </div>
    </div>
  );
}

export function PremiumRulesCard() {
  const rules = [
    "誹謗中傷・差別的発言は禁止",
    "個人情報の投稿は控えてください",
    "スパム・宣伝行為は禁止",
  ];

  return (
    <div className="premium-card p-4">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">コミュニティルール</h3>
      <ul className="mt-3 space-y-2">
        {rules.map((rule) => (
          <li key={rule} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
            <span className="mt-0.5 text-[var(--gold)]">✓</span>
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PremiumRightSidebar({
  rankingAthletes = [],
}: {
  rankingAthletes?: RankingPreviewAthlete[];
}) {
  return (
    <div className="space-y-5">
      <PremiumOnlineUsers />
      <PremiumSupportRanking athletes={rankingAthletes} />
      <PremiumLimitedContent />
      <PremiumRulesCard />
      <PremiumPromoCard />
    </div>
  );
}
