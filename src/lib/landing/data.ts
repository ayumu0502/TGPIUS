import {
  recommendedAthletes,
  supportedAthletes,
  giftHistory,
  fanEvents,
  type MockAthlete,
} from "@/lib/dashboard/mock-data";

export type RankingEntry = MockAthlete & {
  rank: number;
  points: number;
  trend: "up" | "down" | "same";
  change: string;
};

export type Sponsor = {
  id: string;
  name: string;
  category: string;
};

export type ExclusiveItem = {
  id: string;
  title: string;
  athlete: string;
  type: "動画" | "写真" | "ライブ";
  badge: string;
};

export type PlatformFeature = {
  id: string;
  title: string;
  description: string;
  icon: "gift" | "ranking" | "exclusive" | "event" | "shield" | "sponsor";
};

export type LandingStat = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  icon: "athlete" | "gift" | "points" | "supporter";
};

export type SupportFormScene = {
  id: string;
  label: string;
  caption: string;
  variant: "stadium" | "court" | "track" | "pool";
};

export type Review = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
};

export const featuredAthletes: MockAthlete[] = [
  ...supportedAthletes,
  ...recommendedAthletes.slice(0, 4),
];

export const liveRanking: RankingEntry[] = [
  { ...recommendedAthletes[2], rank: 1, points: 48250, trend: "up", change: "+12%" },
  { ...supportedAthletes[0], rank: 2, points: 42100, trend: "up", change: "+8%" },
  { ...recommendedAthletes[0], rank: 3, points: 38900, trend: "same", change: "±0%" },
  { ...supportedAthletes[1], rank: 4, points: 31200, trend: "down", change: "-2%" },
  { ...recommendedAthletes[1], rank: 5, points: 28750, trend: "up", change: "+5%" },
];

export const sponsors: Sponsor[] = [
  { id: "1", name: "TOYOTA", category: "自動車" },
  { id: "2", name: "ANA", category: "航空" },
  { id: "3", name: "SHISEIDO", category: "美容・健康" },
  { id: "4", name: "RAKUTEN", category: "EC・スポーツ" },
  { id: "5", name: "MITSUBISHI", category: "重工・エネルギー" },
  { id: "6", name: "ASICS", category: "スポーツ用品" },
];

export const recentGifts = giftHistory;

export const upcomingEvents = fanEvents;

export const exclusiveContent: ExclusiveItem[] = [
  {
    id: "1",
    title: "試合前ルーティン完全公開",
    athlete: "田中 翔",
    type: "動画",
    badge: "会員限定",
  },
  {
    id: "2",
    title: "トレーニング裏側フォト",
    athlete: "佐藤 美咲",
    type: "写真",
    badge: "スポンサー限定",
  },
  {
    id: "3",
    title: "ライブQ&Aセッション",
    athlete: "山本 健",
    type: "ライブ",
    badge: "今週のみ",
  },
];

export const landingStats: LandingStat[] = [
  { id: "1", label: "登録アスリート数", value: "12,345+", sublabel: "人が登録中", icon: "athlete" },
  { id: "2", label: "ギフト送信数", value: "98,765+", sublabel: "回の応援", icon: "gift" },
  { id: "3", label: "総応援ポイント", value: "1,234,567+", unit: "pt", icon: "points" },
  { id: "4", label: "サポーター数", value: "56,789+", sublabel: "人が参加中", icon: "supporter" },
];

export const supportFormScenes: SupportFormScene[] = [
  { id: "1", label: "スタジアム", caption: "スタジアムで応援", variant: "stadium" },
  { id: "2", label: "コート", caption: "コートで応援", variant: "court" },
  { id: "3", label: "トラック", caption: "トラックで応援", variant: "track" },
  { id: "4", label: "プール", caption: "プールで応援", variant: "pool" },
];

export const platformFeatures: PlatformFeature[] = [
  {
    id: "1",
    title: "ギフトで応援",
    description: "ポイントを使ってアスリートにギフトを贈ることができます。",
    icon: "gift",
  },
  {
    id: "2",
    title: "月額サポーター",
    description: "限定コンテンツや特典で、アスリートを継続的に応援できます。",
    icon: "shield",
  },
  {
    id: "3",
    title: "イベントに参加",
    description: "アスリートのイベントや試合に参加し、直接応援できます。",
    icon: "event",
  },
  {
    id: "4",
    title: "スポンサー支援",
    description: "企業としてアスリートを支援し、共に未来を創ります。",
    icon: "sponsor",
  },
  {
    id: "5",
    title: "ランキング",
    description: "人気アスリートのランキングをチェックして応援しよう。",
    icon: "ranking",
  },
  {
    id: "6",
    title: "限定コンテンツ",
    description: "サポーター限定の投稿や動画をお楽しみいただけます。",
    icon: "exclusive",
  },
];

export const reviews: Review[] = [
  {
    id: "1",
    name: "Yuki M.",
    role: "陸上ファン",
    quote:
      "推しの選手に直接メッセージを届けられる体験は、他では味わえません。ギフト機能も直感的で、毎日の応援が習慣になりました。",
    rating: 5,
  },
  {
    id: "2",
    name: "Kenji S.",
    role: "企業マーケティング",
    quote:
      "スポンサーとして最適なアスリートとの出会いがスムーズ。成果の可視化もでき、ブランド価値の向上に直結しています。",
    rating: 5,
  },
  {
    id: "3",
    name: "Aya T.",
    role: "アスリート",
    quote:
      "ファンとの距離が近づき、モチベーションが大きく上がりました。応援の熱量が試合前の力になっています。",
    rating: 5,
  },
];
