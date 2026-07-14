import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "パスワード再設定",
  description: "TGPLUSアカウントのパスワードを再設定します。",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
