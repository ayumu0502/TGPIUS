import type { Metadata } from "next";
import Link from "next/link";
import { listProvisionalAthletes } from "@/app/actions/admin-athletes";
import AdminAthleteList from "@/components/admin/AdminAthleteList";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "アスリート招待管理",
  description: "招待済み・未登録・登録完了のステータス管理",
  path: "/admin/athletes",
  noIndex: true,
});

export default async function AdminAthletesPage() {
  const athletes = await listProvisionalAthletes();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">アスリート招待管理</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            仮登録・招待・登録完了のステータスを確認できます
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/athletes/import"
            className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm font-medium"
          >
            CSV一括登録
          </Link>
          <Link href="/admin/athletes/new" className="btn-gold rounded-full px-5 py-2 text-sm">
            新規仮登録
          </Link>
        </div>
      </div>
      <AdminAthleteList athletes={athletes} />
    </div>
  );
}
