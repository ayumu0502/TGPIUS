import type { Metadata } from "next";
import Link from "next/link";
import { listAthleteApplications } from "@/app/actions/admin-applications";
import AdminAthleteApplications from "@/components/admin/AdminAthleteApplications";
import { createPageMetadata } from "@/lib/seo/metadata";
import type { AthleteReviewStatus } from "@/types/athlete-application";

export const metadata: Metadata = createPageMetadata({
  title: "選手申請審査",
  description: "TGPLUS 選手申請の審査管理",
  path: "/admin/applications",
  noIndex: true,
});

type AdminApplicationsPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

function parseStatus(value: string | undefined): AthleteReviewStatus | "all" {
  const allowed: (AthleteReviewStatus | "all")[] = [
    "all",
    "not_applied",
    "pending",
    "approved",
    "rejected",
    "resubmit",
    "suspended",
  ];
  if (value && allowed.includes(value as AthleteReviewStatus | "all")) {
    return value as AthleteReviewStatus | "all";
  }
  return "pending";
}

export default async function AdminApplicationsPage({
  searchParams,
}: AdminApplicationsPageProps) {
  const { q, status } = await searchParams;
  const searchQuery = q?.trim() ?? "";
  const statusFilter = parseStatus(status);

  const applications = await listAthleteApplications({
    status: statusFilter,
    query: searchQuery,
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            選手申請・審査
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            申請内容の確認、本人確認書類の閲覧、承認・却下
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--gold-dark)] hover:underline"
        >
          概要へ戻る
        </Link>
      </div>

      <AdminAthleteApplications
        applications={applications}
        initialStatus={statusFilter}
        searchQuery={searchQuery}
      />
    </>
  );
}
