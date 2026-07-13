import Link from "next/link";
import { AuthLogo } from "@/components/auth/AuthBackground";
import type { AccountType } from "@/types/auth";

const accountTypeLabels: Record<AccountType, string> = {
  fan: "ファン",
  athlete: "アスリート",
  sponsor: "スポンサー",
};

type SocialLayoutProps = {
  children: React.ReactNode;
  currentUserId: string;
  accountType: AccountType;
  activeTab: "feed" | "new" | "profile" | "messages";
  unreadCount?: number;
};

function NavIcon({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <span className={active ? "text-[var(--gold-dark)]" : "text-[var(--text-muted)]"}>
      {children}
    </span>
  );
}

export default function SocialLayout({
  children,
  currentUserId,
  accountType,
  activeTab,
  unreadCount = 0,
}: SocialLayoutProps) {
  const dashboardPath = `/${accountType}/dashboard`;

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--content-bg)] pb-20">
      <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <AuthLogo />
          <Link
            href={dashboardPath}
            className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--gold-dark)]"
          >
            ダッシュボード
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--card-border)] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          <Link
            href="/feed"
            className="flex flex-col items-center gap-1 px-4 py-2"
          >
            <NavIcon active={activeTab === "feed"}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </NavIcon>
            <span className={`text-[10px] ${activeTab === "feed" ? "text-[var(--gold-dark)]" : "text-[var(--text-muted)]"}`}>
              ホーム
            </span>
          </Link>

          <Link
            href="/post/new"
            className="flex flex-col items-center gap-1 px-4 py-2"
          >
            <NavIcon active={activeTab === "new"}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </NavIcon>
            <span className={`text-[10px] ${activeTab === "new" ? "text-[var(--gold-dark)]" : "text-[var(--text-muted)]"}`}>
              投稿
            </span>
          </Link>

          <Link
            href="/messages"
            className="relative flex flex-col items-center gap-1 px-4 py-2"
          >
            <NavIcon active={activeTab === "messages"}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </NavIcon>
            {unreadCount > 0 ? (
              <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
            <span className={`text-[10px] ${activeTab === "messages" ? "text-[var(--gold-dark)]" : "text-[var(--text-muted)]"}`}>
              メッセージ
            </span>
          </Link>

          <Link
            href={`/profile/${currentUserId}`}
            className="flex flex-col items-center gap-1 px-4 py-2"
          >
            <NavIcon active={activeTab === "profile"}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </NavIcon>
            <span className={`text-[10px] ${activeTab === "profile" ? "text-[var(--gold-dark)]" : "text-[var(--text-muted)]"}`}>
              プロフィール
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function ProfileAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-20 w-20 text-2xl",
  };

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`shrink-0 rounded-full border border-[var(--card-border)] object-cover ${sizes[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-[rgba(197,160,89,0.2)] bg-[rgba(197,160,89,0.1)] font-bold text-[var(--gold-dark)] ${sizes[size]}`}
    >
      {name.charAt(0)}
    </div>
  );
}

export function AccountBadge({ accountType }: { accountType: AccountType }) {
  return (
    <span className="badge-gold rounded-full px-2 py-0.5 text-[10px]">
      {accountTypeLabels[accountType]}
    </span>
  );
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
