import type { Profile } from "@/types/auth";
import { isApprovedAthlete } from "@/lib/athlete/status";

export function canViewAthleteProfile(
  profile: Pick<
    Profile,
    "id" | "account_type" | "athlete_review_status" | "is_profile_public"
  > & { is_profile_public?: boolean },
  viewerId: string | null,
  isAdmin = false
): boolean {
  if (isAdmin) return true;
  if (profile.account_type !== "athlete") return true;
  if (viewerId === profile.id) return true;

  if (profile.athlete_review_status !== "approved") {
    return false;
  }

  if (profile.is_profile_public === false) {
    return false;
  }

  return true;
}

export function canEditOwnAthleteProfile(
  profile: Pick<Profile, "account_type" | "athlete_review_status" | "invited_via_provisional_id">
): boolean {
  if (profile.account_type !== "athlete") return false;
  if (isApprovedAthlete(profile)) return true;
  if (profile.invited_via_provisional_id) {
    return (
      profile.athlete_review_status === "approved" ||
      profile.athlete_review_status === "pending"
    );
  }
  return false;
}

export function canCreatePosts(
  profile: Pick<Profile, "account_type" | "athlete_review_status">
): boolean {
  return isApprovedAthlete(profile);
}
