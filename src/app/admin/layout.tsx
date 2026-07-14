import type { ReactNode } from "react";
import { requireAdmin } from "@/app/actions/admin";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import AdminNav from "@/components/admin/AdminNav";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const profile = await requireAdmin();

  return (
    <AdminDashboardLayout name={profile.name} email={profile.email}>
      <AdminNav />
      {children}
    </AdminDashboardLayout>
  );
}
