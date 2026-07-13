import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "新規会員登録",
  description: "TGPLUSに新規登録して、アスリートの挑戦を応援しましょう。",
  path: "/register",
});

export default function RegisterPage() {
  return <RegisterForm />;
}
