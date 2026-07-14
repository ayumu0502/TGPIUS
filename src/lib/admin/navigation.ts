export type AdminNavItem = {
  href: string;
  label: string;
  description?: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "概要" },
  { href: "/admin/users", label: "ユーザー" },
  { href: "/admin/applications", label: "選手申請" },
  { href: "/admin/posts", label: "投稿" },
  { href: "/admin/comments", label: "コメント" },
  { href: "/admin/events", label: "イベント" },
  { href: "/admin/exclusive", label: "限定コンテンツ" },
  { href: "/admin/reports", label: "通報" },
  { href: "/admin/blocks", label: "ブロック" },
  { href: "/admin/payments", label: "決済・履歴" },
  { href: "/admin/announcements", label: "お知らせ" },
  { href: "/admin/audit", label: "監査ログ" },
];
