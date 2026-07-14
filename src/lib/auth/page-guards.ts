import { redirect } from "next/navigation";
import type { AccountType, Profile } from "@/types/auth";
import { getDashboardPath } from "@/lib/auth/routes";
import { isAdminUser } from "@/lib/auth/admin-access";

export function ensureLoggedIn(profile: Profile | null): Profile {
  if (!profile) redirect("/login");
  return profile;
}

export function ensureAccountType(profile: Profile, type: AccountType): void {
  if (profile.account_type !== type && !isAdminUser(profile)) {
    redirect(getDashboardPath(profile.account_type));
  }
}
