import type { Metadata } from "next";
import { listUsersForAdmin } from "@/app/actions/admin-moderation";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import { createPageMetadata } from "@/lib/seo/metadata";
import type { AccountType } from "@/types/auth";
import type { AdminUser } from "@/types/admin";
import type { AthleteReviewStatus } from "@/types/athlete-application";

export const metadata: Metadata = createPageMetadata({
  title: "ユーザー管理",
  description: "TGPLUS ユーザー管理",
  path: "/admin/users",
  noIndex: true,
});

type AdminUsersPageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

function parseAccountType(value: string | undefined): AccountType | "all" {
  if (value === "fan" || value === "athlete" || value === "sponsor") return value;
  return "all";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { q, type } = await searchParams;
  const accountType = parseAccountType(type);
  const rows = await listUsersForAdmin({ query: q, accountType, limit: 80 });

  const users: (AdminUser & { athlete_review_status?: AthleteReviewStatus | null })[] =
    rows.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      email: String(row.email ?? ""),
      account_type: row.account_type as AccountType,
      is_suspended: Boolean(row.is_suspended),
      is_admin: Boolean(row.is_admin),
      point_balance: Number(row.point_balance ?? 0),
      created_at: String(row.created_at ?? ""),
      athlete_review_status: row.athlete_review_status as AthleteReviewStatus | null,
    }));

  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          ユーザー管理
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          検索・種別フィルタ・アカウント停止・削除
        </p>
      </div>
      <AdminUsersPanel
        users={users}
        searchQuery={q?.trim() ?? ""}
        accountType={accountType}
      />
    </>
  );
}
