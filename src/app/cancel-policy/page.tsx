import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { createPageMetadata } from "@/lib/seo/metadata";
import { cancelPolicyPage } from "@/lib/legal/content";

export const metadata: Metadata = createPageMetadata({
  title: "キャンセルポリシー",
  description: cancelPolicyPage.description,
  path: "/cancel-policy",
});

export default function CancelPolicyPage() {
  return <LegalPageLayout content={cancelPolicyPage} />;
}
