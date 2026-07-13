import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { createPageMetadata } from "@/lib/seo/metadata";
import { privacyPage } from "@/lib/legal/content";

export const metadata: Metadata = createPageMetadata({
  title: "プライバシーポリシー",
  description: privacyPage.description,
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPageLayout content={privacyPage} />;
}
