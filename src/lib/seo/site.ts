export const SITE_NAME = "TGPLUS";
export const SITE_TAGLINE = "アスリート・ファン・企業をつなぐスポーツ応援プラットフォーム";
export const SITE_DESCRIPTION =
  "TGPLUSは、アスリート・ファン・企業スポンサーをつなぐスポーツ応援プラットフォームです。ギフト、メッセージ、イベントを通じて、選手の挑戦を支援できます。";

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/terms",
  "/privacy",
  "/legal",
  "/cancel-policy",
  "/company",
  "/contact",
  "/supporter",
] as const;

export const NOINDEX_ROUTE_PREFIXES = [
  "/admin",
  "/api",
  "/messages",
  "/gift/send",
  "/points/purchase",
  "/post/new",
  "/athlete/profile/edit",
  "/events/create",
] as const;
