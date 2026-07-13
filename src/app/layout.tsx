import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import JsonLd from "@/components/seo/JsonLd";
import PWAInstallBanner from "@/components/pwa/PWAInstallBanner";
import PWARegister from "@/components/pwa/PWARegister";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased pwa-body">
        <JsonLd />
        {children}
        <PWARegister />
        <PWAInstallBanner />
      </body>
    </html>
  );
}
