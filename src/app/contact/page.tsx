import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { createPageMetadata } from "@/lib/seo/metadata";
import { contactPage } from "@/lib/legal/content";

export const metadata: Metadata = createPageMetadata({
  title: "お問い合わせ",
  description: contactPage.description,
  path: "/contact",
});

export default function ContactPage() {
  return <LegalPageLayout content={contactPage} />;
}
