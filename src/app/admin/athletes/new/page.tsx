import type { Metadata } from "next";
import Link from "next/link";
import { listOrganizations, listProvisionalAthletes } from "@/app/actions/admin-athletes";
import AdminAthleteNewForm from "@/components/admin/AdminAthleteNewForm";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "アスリート仮登録",
  description: "管理者によるアスリート招待・仮登録",
  path: "/admin/athletes/new",
  noIndex: true,
});

export default async function AdminAthleteNewPage() {
  const organizations = await listOrganizations();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">アスリート仮登録</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            仮プロフィールを作成し、招待メールで選手登録を案内します
          </p>
        </div>
        <Link
          href="/admin/athletes"
          className="text-sm font-medium text-[var(--gold-dark)] hover:underline"
        >
          一覧へ
        </Link>
      </div>
      <AdminAthleteNewForm organizations={organizations} />
    </div>
  );
}
