import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "ログイン",
  description: "TGPLUSアカウントにログインしてください。",
  path: "/login",
});

function LoginFormFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--content-bg)] text-[var(--text-muted)]">
      読み込み中...
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
