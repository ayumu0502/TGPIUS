import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { createPageMetadata } from "@/lib/seo/metadata";
import { termsPage } from "@/lib/legal/content";

export const metadata: Metadata = createPageMetadata({
  title: "利用規約",
  description: termsPage.description,
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPageLayout content={termsPage} />;
}
