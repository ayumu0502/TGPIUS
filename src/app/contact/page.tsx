import type { Metadata } from "next";
import ContactPageLayout from "@/components/contact/ContactPageLayout";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "お問い合わせ",
  description:
    "スポンサー契約、タイアップ企画、広告掲載、イベント協賛、福利厚生・法人利用など、企業・スポンサー様向けのお問い合わせフォームです。",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageLayout />;
}
