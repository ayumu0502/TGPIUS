import type { Metadata } from "next";
import Link from "next/link";
import AdminAthleteImportForm from "@/components/admin/AdminAthleteImportForm";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "アスリートCSV一括登録",
  path: "/admin/athletes/import",
  noIndex: true,
});

export default function AdminAthleteImportPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/athletes" className="text-sm text-[var(--gold-dark)] hover:underline">
          ← 招待管理へ
        </Link>
        <h1 className="mt-3 text-2xl font-bold">CSV一括仮登録</h1>
      </div>
      <AdminAthleteImportForm />
    </div>
  );
}
