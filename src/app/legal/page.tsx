import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { createPageMetadata } from "@/lib/seo/metadata";
import { legalNoticePage } from "@/lib/legal/content";

export const metadata: Metadata = createPageMetadata({
  title: "特定商取引法に基づく表記",
  description: legalNoticePage.description,
  path: "/legal",
});

export default function LegalNoticePage() {
  return <LegalPageLayout content={legalNoticePage} />;
}
