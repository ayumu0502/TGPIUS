import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "TGPLUS — アスリート・ファン・企業をつなぐスポーツ応援プラットフォーム",
  description:
    "応援が、チカラになる。TGPLUSはギフト・ランキング・イベントでアスリートの挑戦を支えるスポーツ応援プラットフォームです。",
  path: "/",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="landing-page">{children}</div>;
}
