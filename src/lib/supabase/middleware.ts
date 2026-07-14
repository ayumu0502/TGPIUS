import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAccountTypeFromMetadata,
  getAthleteEntryPath,
  getDashboardPath,
  getDashboardPrefix,
} from "@/lib/auth/routes";
import { isAdminUser } from "@/lib/auth/admin-access";
import { isAthleteGatedPath } from "@/lib/athlete/status";
import type { AthleteReviewStatus } from "@/types/athlete-application";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const requiredRole = getDashboardPrefix(pathname);
  const isDashboardRoute = requiredRole !== null;
  const isAdminRoute = pathname.startsWith("/admin/");
  const isSocialRoute =
    pathname === "/feed" ||
    pathname.startsWith("/post/") ||
    pathname.startsWith("/profile/");
  const isGiftRoute = pathname.startsWith("/gift/");
  const isPointsRoute = pathname.startsWith("/points/");
  const isMessagesRoute = pathname.startsWith("/messages/");
  const isNotificationsRoute = pathname.startsWith("/notifications/");
  const isSearchRoute = pathname.startsWith("/search");
  const isRankingsRoute = pathname.startsWith("/rankings");
  const isEventsRoute = pathname.startsWith("/events");
  const isFanclubRoute = pathname.startsWith("/fanclub");
  const isProtectedRoute =
    isDashboardRoute ||
    isSocialRoute ||
    isGiftRoute ||
    isPointsRoute ||
    isMessagesRoute ||
    isNotificationsRoute ||
    isSearchRoute ||
    isRankingsRoute ||
    isEventsRoute ||
    isFanclubRoute ||
    isAdminRoute;

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const accountType = getAccountTypeFromMetadata(user.user_metadata);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_suspended, account_type, athlete_review_status, invited_via_provisional_id")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.is_admin === true;
    const isSuspended = profile?.is_suspended === true;
    const resolvedAccountType =
      accountType ?? (profile?.account_type as typeof accountType) ?? null;

    if (isSuspended && !isAuthPage) {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("suspended", "1");
      redirectUrl.search = redirectUrl.searchParams.toString();
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthPage) {
      const redirectUrl = request.nextUrl.clone();
      if (resolvedAccountType) {
        redirectUrl.pathname =
          resolvedAccountType === "athlete"
            ? getAthleteEntryPath(
                profile?.athlete_review_status as AthleteReviewStatus | null | undefined
              )
            : getDashboardPath(resolvedAccountType);
      } else {
        redirectUrl.pathname = "/register";
      }
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdminRoute && !isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = resolvedAccountType
        ? getDashboardPath(resolvedAccountType)
        : "/login";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (
      requiredRole &&
      resolvedAccountType &&
      requiredRole !== resolvedAccountType &&
      !isAdminUser(profile)
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname =
        resolvedAccountType === "athlete"
          ? getAthleteEntryPath(
              profile?.athlete_review_status as AthleteReviewStatus | null | undefined
            )
          : getDashboardPath(resolvedAccountType);
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (
      resolvedAccountType === "athlete" &&
      isAthleteGatedPath(pathname) &&
      profile?.athlete_review_status !== "approved"
    ) {
      const isProfileEdit =
        pathname === "/athlete/profile/edit" ||
        pathname.startsWith("/athlete/profile/edit/");
      const invitedEditable =
        isProfileEdit &&
        profile?.invited_via_provisional_id &&
        (profile.athlete_review_status === "approved" ||
          profile.athlete_review_status === "pending");

      if (!invitedEditable) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/athlete/apply";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
