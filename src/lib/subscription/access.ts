import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { PlatformSubscriptionStatus } from "@/types/subscription";

export type SupporterAccess = {
  isActive: boolean;
  status: PlatformSubscriptionStatus;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const ACTIVE_STATUSES = new Set<PlatformSubscriptionStatus>(["active", "trialing"]);

export async function getSupporterAccess(userId: string): Promise<SupporterAccess> {
  const supabase = createServiceClient();
  const { data: sub } = await supabase
    .from("platform_subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const status = (sub?.status ?? "inactive") as PlatformSubscriptionStatus;

  return {
    isActive: ACTIVE_STATUSES.has(status),
    status,
    periodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
  };
}

export async function getCurrentUserSupporterAccess(): Promise<SupporterAccess | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getSupporterAccess(user.id);
}

export function isSupporterStatusActive(status: string): boolean {
  return ACTIVE_STATUSES.has(status as PlatformSubscriptionStatus);
}
