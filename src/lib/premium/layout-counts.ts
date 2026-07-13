import { getCurrentProfile } from "@/app/actions/auth";
import { getPointBalance } from "@/app/actions/gifts";
import { getTotalUnreadCount } from "@/app/actions/messages";
import { getUnreadNotificationCount } from "@/app/actions/notifications";
import type { AccountType } from "@/types/auth";

export type PremiumLayoutCounts = {
  notificationCount: number;
  messageUnreadCount: number;
  pointBalance?: number;
};

export async function getPremiumLayoutCounts(
  accountType: AccountType
): Promise<PremiumLayoutCounts> {
  const [notificationCount, messageUnreadCount, pointBalance] =
    await Promise.all([
      getUnreadNotificationCount(),
      getTotalUnreadCount(),
      accountType === "fan" ? getPointBalance() : Promise.resolve(undefined),
    ]);

  return { notificationCount, messageUnreadCount, pointBalance };
}
