import type { AccountType } from "@/types/auth";

export type PremiumNavId =
  | "dashboard"
  | "feed"
  | "athletes"
  | "search"
  | "rankings"
  | "gifts"
  | "points"
  | "messages"
  | "notifications"
  | "profile"
  | "events"
  | "fanclub"
  | "subscriptions"
  | "following";

export type NavItem = {
  id: PremiumNavId;
  label: string;
  href: string;
  icon: string;
  section?: string;
  roles?: AccountType[];
};

export const TOP_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "トップ", href: "/fan/dashboard", icon: "home" },
  { id: "search", label: "検索", href: "/search", icon: "search" },
  { id: "rankings", label: "ランキング", href: "/rankings", icon: "trophy" },
  { id: "athletes", label: "選手一覧", href: "/search", icon: "users" },
  { id: "events", label: "イベント", href: "/events", icon: "calendar" },
  { id: "fanclub", label: "ファンクラブ", href: "/fanclub", icon: "heart" },
  { id: "feed", label: "フィード", href: "/feed", icon: "feed" },
  { id: "messages", label: "メッセージ", href: "/messages", icon: "message" },
];

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "マイページ",
    href: "/fan/dashboard",
    icon: "home",
    section: "メイン",
  },
  {
    id: "search",
    label: "検索・発見",
    href: "/search",
    icon: "search",
    section: "メイン",
  },
  {
    id: "rankings",
    label: "ランキング",
    href: "/rankings",
    icon: "trophy",
    section: "メイン",
  },
  {
    id: "following",
    label: "フォロー中",
    href: "/following",
    icon: "users",
    section: "メイン",
  },
  {
    id: "athletes",
    label: "推しの選手",
    href: "/fan/gifts",
    icon: "star",
    section: "メイン",
    roles: ["fan"],
  },
  {
    id: "gifts",
    label: "ギフト履歴",
    href: "/fan/gifts",
    icon: "gift",
    section: "メイン",
    roles: ["fan"],
  },
  {
    id: "gifts",
    label: "受信ギフト",
    href: "/athlete/gifts",
    icon: "gift",
    section: "メイン",
    roles: ["athlete"],
  },
  {
    id: "points",
    label: "ポイント購入",
    href: "/points/purchase",
    icon: "coin",
    section: "メイン",
    roles: ["fan"],
  },
  {
    id: "events",
    label: "イベント",
    href: "/events",
    icon: "calendar",
    section: "メイン",
  },
  {
    id: "subscriptions",
    label: "マイサブスク",
    href: "/fan/subscriptions",
    icon: "heart",
    section: "メイン",
    roles: ["fan"],
  },
  {
    id: "fanclub",
    label: "ファンクラブ",
    href: "/fanclub",
    icon: "heart",
    section: "メイン",
  },
  {
    id: "feed",
    label: "フィード",
    href: "/feed",
    icon: "feed",
    section: "コミュニティ",
  },
  {
    id: "messages",
    label: "メッセージ",
    href: "/messages",
    icon: "message",
    section: "コミュニティ",
  },
  {
    id: "notifications",
    label: "通知",
    href: "/notifications",
    icon: "bell",
    section: "通知",
  },
  {
    id: "profile",
    label: "プロフィール",
    href: "/profile",
    icon: "user",
    section: "コミュニティ",
  },
];

export function getDashboardPath(accountType: AccountType): string {
  return `/${accountType}/dashboard`;
}

export function filterNavForRole(
  items: NavItem[],
  accountType: AccountType
): NavItem[] {
  return items.filter(
    (item) => !item.roles || item.roles.includes(accountType)
  );
}
