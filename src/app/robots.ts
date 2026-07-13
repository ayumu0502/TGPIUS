import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/messages/",
          "/gift/send/",
          "/points/purchase/",
          "/post/new",
          "/athlete/profile/edit",
          "/events/create",
          "/offline",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
