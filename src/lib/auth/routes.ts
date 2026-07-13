import type { AccountType } from "@/types/auth";

export const DASHBOARD_PATHS: Record<AccountType, string> = {
  fan: "/fan/dashboard",
  athlete: "/athlete/dashboard",
  sponsor: "/sponsor/dashboard",
};

export function getDashboardPath(accountType: AccountType): string {
  return DASHBOARD_PATHS[accountType];
}

export function isAccountType(value: string): value is AccountType {
  return value === "fan" || value === "athlete" || value === "sponsor";
}

export function getAccountTypeFromMetadata(
  metadata: Record<string, unknown> | undefined
): AccountType | null {
  const accountType = metadata?.account_type;

  if (typeof accountType === "string" && isAccountType(accountType)) {
    return accountType;
  }

  return null;
}

export function getDashboardPrefix(pathname: string): AccountType | null {
  if (pathname.startsWith("/fan/")) return "fan";
  if (pathname.startsWith("/athlete/")) return "athlete";
  if (pathname.startsWith("/sponsor/")) return "sponsor";
  return null;
}
