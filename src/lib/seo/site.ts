export const SITE_NAME = "TGPLUS";
export const SITE_TITLE =
  "TGPLUS｜アスリートとファンをつなぐ応援プラットフォーム";
export const SITE_TAGLINE = "アスリートとファンをつなぐ応援プラットフォーム";
export const SITE_DESCRIPTION =
  "TGPLUSは、アスリート・ファン・スポンサーをつなぐスポーツ応援プラットフォームです。選手の活動を知り、ポイントやギフトを通じて応援できます。";

/** Canonical production domain (apex, no trailing slash). */
export const PRODUCTION_SITE_URL = "https://tgplus.jp";

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Public pages that should appear in sitemap.xml */
export const SITEMAP_ROUTES = [
  "/",
  "/supporter",
  "/terms",
  "/privacy",
  "/legal",
  "/cancel-policy",
  "/company",
  "/contact",
] as const;

/** Route prefixes that must not be indexed */
export const NOINDEX_ROUTE_PREFIXES = [
  "/admin",
  "/api",
  "/login",
  "/register",
  "/feed",
  "/search",
  "/rankings",
  "/events",
  "/fanclub",
  "/notifications",
  "/messages",
  "/gift",
  "/points",
  "/post",
  "/athlete",
  "/fan",
  "/sponsor",
  "/following",
  "/followers",
  "/profile",
  "/offline",
] as const;
