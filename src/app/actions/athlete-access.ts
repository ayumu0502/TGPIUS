"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/auth";
import { isApprovedAthlete } from "@/lib/athlete/status";
import type { Profile } from "@/types/auth";

export async function requireApprovedAthlete(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "athlete") {
    redirect(`/${profile.account_type}/dashboard`);
  }
  if (!isApprovedAthlete(profile)) {
    redirect("/athlete/apply");
  }
  return profile;
}

export async function requireAthleteApplicant(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_type !== "athlete") {
    redirect(`/${profile.account_type}/dashboard`);
  }
  return profile;
}
