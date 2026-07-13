import type { Metadata } from "next";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  ogType?: "website" | "article" | "profile";
};

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "",
  noIndex = false,
  ogType = "website",
}: PageMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${siteUrl}${canonicalPath === "/" ? "" : canonicalPath}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: ogType,
      locale: "ja_JP",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/opengraph-image"],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: getSiteUrl(),
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};
