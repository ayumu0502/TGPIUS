import type { Metadata } from "next";
import { listAllOrganizationMembers, listOrganizations } from "@/app/actions/admin-athletes";
import AdminOrganizationsPanel from "@/components/admin/AdminOrganizationsPanel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "組織管理",
  path: "/admin/organizations",
  noIndex: true,
});

export default async function AdminOrganizationsPage() {
  const [organizations, membersByOrg] = await Promise.all([
    listOrganizations(),
    listAllOrganizationMembers(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">組織管理</h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        事務所・チーム・学校・クラブを登録し、所属選手の退所・活動停止・非公開を管理できます
      </p>
      <AdminOrganizationsPanel organizations={organizations} membersByOrg={membersByOrg} />
    </div>
  );
}
