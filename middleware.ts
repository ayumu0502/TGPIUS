import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/feed",
    "/post/:path*",
    "/profile/:path*",
    "/gift/:path*",
    "/points/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/fan/:path*",
    "/athlete/:path*",
    "/sponsor/:path*",
    "/search/:path*",
    "/rankings/:path*",
    "/events/:path*",
    "/fanclub/:path*",
    "/following",
    "/followers/:path*",
    "/admin/:path*",
  ],
};
