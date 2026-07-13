import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { createPageMetadata } from "@/lib/seo/metadata";
import { companyPage } from "@/lib/legal/content";

export const metadata: Metadata = createPageMetadata({
  title: "会社概要",
  description: companyPage.description,
  path: "/company",
});

export default function CompanyPage() {
  return <LegalPageLayout content={companyPage} />;
}
