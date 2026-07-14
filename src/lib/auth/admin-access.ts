import type { AccountType, Profile } from "@/types/auth";
import {
  getAthleteEntryPath,
  getDashboardPath,
} from "@/lib/auth/routes";

export function isAdminUser(
  profile: Pick<Profile, "is_admin"> | null | undefined
): boolean {
  return profile?.is_admin === true;
}

export function isSafeInternalRedirect(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.startsWith("/admin")) return false;
  if (path === "/login" || path === "/register") return false;
  return true;
}

export function getDefaultPostLoginPath(
  accountType: AccountType,
  athleteReviewStatus?: Profile["athlete_review_status"]
): string {
  if (accountType === "athlete") {
    return getAthleteEntryPath(athleteReviewStatus);
  }
  return getDashboardPath(accountType);
}

export function resolvePostLoginRedirect(
  redirectTo: string,
  accountType: AccountType,
  athleteReviewStatus?: Profile["athlete_review_status"]
): string {
  if (redirectTo && isSafeInternalRedirect(redirectTo)) {
    return redirectTo;
  }
  return getDefaultPostLoginPath(accountType, athleteReviewStatus);
}

export function toPremiumCurrentUser(profile: Profile) {
  return {
    id: profile.id,
    name: profile.name,
    accountType: profile.account_type,
    isAdmin: Boolean(profile.is_admin),
  };
}
