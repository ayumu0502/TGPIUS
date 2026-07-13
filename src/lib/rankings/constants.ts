import type { RankingCategory, RankingPeriod } from "@/types/rankings";

export const RANKING_CATEGORIES: {
  value: RankingCategory;
  label: string;
  description: string;
  fixedPeriod?: RankingPeriod;
}[] = [
  {
    value: "overall",
    label: "総合",
    description: "ギフト・フォロワー・いいねを総合評価",
  },
  {
    value: "gifts_month",
    label: "月間ギフト",
    description: "直近30日間のギフト支援額",
    fixedPeriod: "month",
  },
  {
    value: "gifts_week",
    label: "週間ギフト",
    description: "直近7日間のギフト支援額",
    fixedPeriod: "week",
  },
  {
    value: "followers",
    label: "フォロワー",
    description: "期間内の新規フォロワー数",
  },
  {
    value: "likes",
    label: "いいね",
    description: "期間内の投稿いいね数",
  },
  {
    value: "trending",
    label: "急上昇",
    description: "前期比で伸びている選手",
  },
];

export const RANKING_PERIODS: { value: RankingPeriod; label: string }[] = [
  { value: "day", label: "日間" },
  { value: "week", label: "週間" },
  { value: "month", label: "月間" },
  { value: "all", label: "累計" },
];

export const PERIOD_LOCKED_CATEGORIES: RankingCategory[] = [
  "gifts_month",
  "gifts_week",
];

export function formatRankingScore(
  category: RankingCategory,
  entry: {
    score: number;
    gift_score: number;
    follower_score: number;
    like_score: number;
  }
): string {
  switch (category) {
    case "followers":
      return `${entry.follower_score.toLocaleString("ja-JP")}人`;
    case "likes":
      return `${entry.like_score.toLocaleString("ja-JP")}件`;
    case "overall":
    case "gifts_month":
    case "gifts_week":
    case "trending":
    default:
      return `${entry.score.toLocaleString("ja-JP")} pt`;
  }
}

export function getRankMedalStyle(rank: number): string {
  if (rank === 1) {
    return "bg-gradient-to-br from-[var(--gold)] to-[#a8863f] text-white shadow-lg shadow-[var(--gold)]/30";
  }
  if (rank === 2) {
    return "bg-gradient-to-br from-zinc-300 to-zinc-400 text-zinc-800";
  }
  if (rank === 3) {
    return "bg-gradient-to-br from-amber-700/80 to-amber-900 text-amber-100";
  }
  return "bg-zinc-100 text-zinc-600";
}

export function getRankCardStyle(rank: number): string {
  if (rank === 1) {
    return "border-[var(--gold)]/50 bg-gradient-to-br from-[var(--gold)]/10 via-white to-white ring-1 ring-[var(--gold)]/20";
  }
  if (rank === 2) {
    return "border-zinc-300/60 bg-gradient-to-br from-zinc-100/80 to-white";
  }
  if (rank === 3) {
    return "border-amber-700/30 bg-gradient-to-br from-amber-50 to-white";
  }
  return "";
}
