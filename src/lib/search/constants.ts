import type { DiscoverySection, SearchSort } from "@/types/search";

export const GENDER_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
] as const;

export const FOLLOWER_FILTER_OPTIONS = [
  { value: "", label: "指定なし" },
  { value: "1", label: "1人以上" },
  { value: "10", label: "10人以上" },
  { value: "50", label: "50人以上" },
  { value: "100", label: "100人以上" },
] as const;

export const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "relevance", label: "関連度" },
  { value: "gifts", label: "ギフトランキング" },
  { value: "followers", label: "フォロワー数" },
  { value: "trending", label: "急上昇" },
  { value: "newest", label: "新着順" },
];

export const DISCOVERY_SECTIONS: {
  id: DiscoverySection;
  title: string;
  description: string;
}[] = [
  {
    id: "popular",
    title: "人気選手",
    description: "ギフト支援総額が多い選手",
  },
  {
    id: "trending",
    title: "急上昇選手",
    description: "直近7日間で注目されている選手",
  },
  {
    id: "new",
    title: "新着選手",
    description: "最近登録された選手",
  },
  {
    id: "recommended",
    title: "おすすめ選手",
    description: "あなたへのおすすめ",
  },
];

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  fan: "ファン",
  athlete: "アスリート",
  sponsor: "スポンサー",
};

export function formatFollowerCount(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("ja-JP");
}

export function formatGiftTotal(value: number): string {
  return `${value.toLocaleString("ja-JP")} pt`;
}
