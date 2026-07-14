import type { MetadataRoute } from "next";
import { getSiteUrl, NOINDEX_ROUTE_PREFIXES } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...NOINDEX_ROUTE_PREFIXES],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
