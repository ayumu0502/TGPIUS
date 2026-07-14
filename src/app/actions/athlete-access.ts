"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { isAdminUser } from "@/lib/auth/admin-access";
import { isApprovedAthlete } from "@/lib/athlete/status";
import { canEditOwnAthleteProfile } from "@/lib/athlete/visibility";
import type { Profile } from "@/types/auth";

export async function requireApprovedAthlete(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "athlete" && !isAdminUser(profile)) {
    redirect(`/${profile.account_type}/dashboard`);
  }
  if (!isApprovedAthlete(profile) && !isAdminUser(profile)) {
    redirect("/athlete/apply");
  }
  return profile;
}

export async function requireEditableAthleteProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "athlete" && !isAdminUser(profile)) {
    redirect(`/${profile.account_type}/dashboard`);
  }
  if (!canEditOwnAthleteProfile(profile) && !isAdminUser(profile)) {
    redirect("/athlete/apply");
  }
  return profile;
}

export async function requireAthleteApplicant(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "athlete" && !isAdminUser(profile)) {
    redirect(`/${profile.account_type}/dashboard`);
  }
  return profile;
}
