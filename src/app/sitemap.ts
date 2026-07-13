import type { MetadataRoute } from "next";
import { getSiteUrl, PUBLIC_ROUTES } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return PUBLIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/login" || path === "/register" ? 0.8 : 0.6,
  }));
}
