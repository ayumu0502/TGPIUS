import type { Metadata } from "next";
import AdminAnnouncementForm from "@/components/admin/AdminAnnouncementForm";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "お知らせ配信",
  description: "TGPLUS お知らせ配信",
  path: "/admin/announcements",
  noIndex: true,
});

export default function AdminAnnouncementsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="ja-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          お知らせ配信
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          全ユーザーへ運営からのお知らせを送信
        </p>
      </div>
      <div className="max-w-2xl">
        <AdminAnnouncementForm />
      </div>
    </>
  );
}
