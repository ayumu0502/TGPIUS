import type { Metadata } from "next";
import { listOrganizations } from "@/app/actions/admin-athletes";
import AdminOrganizationsPanel from "@/components/admin/AdminOrganizationsPanel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "組織管理",
  path: "/admin/organizations",
  noIndex: true,
});

export default async function AdminOrganizationsPage() {
  const organizations = await listOrganizations();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">組織管理</h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        事務所・チーム・学校・クラブを登録し、アスリートの所属管理に利用します
      </p>
      <AdminOrganizationsPanel organizations={organizations} />
    </div>
  );
}
