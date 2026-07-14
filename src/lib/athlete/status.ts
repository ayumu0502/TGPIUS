import type { Profile } from "@/types/auth";
import type { AthleteReviewStatus } from "@/types/athlete-application";

export function isApprovedAthlete(
  profile: Pick<Profile, "account_type" | "athlete_review_status">
): boolean {
  return (
    profile.account_type === "athlete" &&
    profile.athlete_review_status === "approved"
  );
}

export function canSubmitAthleteApplication(
  status: AthleteReviewStatus | null | undefined
): boolean {
  return status === "not_applied" || status === "rejected" || status === "resubmit";
}

export function isAthleteApplicationPending(
  status: AthleteReviewStatus | null | undefined
): boolean {
  return status === "pending";
}

export function getAthleteEntryPath(
  status: AthleteReviewStatus | null | undefined
): string {
  if (status === "approved") {
    return "/athlete/dashboard";
  }
  return "/athlete/apply";
}

export const ATHLETE_APPLY_PATH = "/athlete/apply";

export const ATHLETE_GATED_PATH_PREFIX = "/athlete/";

export function isAthleteGatedPath(pathname: string): boolean {
  if (!pathname.startsWith(ATHLETE_GATED_PATH_PREFIX)) return false;
  return pathname !== ATHLETE_APPLY_PATH && !pathname.startsWith(`${ATHLETE_APPLY_PATH}/`);
}
