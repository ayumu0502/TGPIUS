import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "新しいパスワードの設定",
  description: "TGPLUSアカウントの新しいパスワードを設定します。",
  path: "/reset-password",
});

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { error = "" } = await searchParams;
  const invalidFromQuery = error === "invalid";

  if (invalidFromQuery) {
    return <ResetPasswordForm invalidLink />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ResetPasswordForm invalidLink />;
  }

  return <ResetPasswordForm />;
}
