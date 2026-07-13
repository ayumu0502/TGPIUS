import { getStripe } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  return (
    subscription.items?.data?.[0]?.current_period_end ??
    ("current_period_end" in subscription
      ? (subscription as Stripe.Subscription & { current_period_end?: number })
          .current_period_end ?? null
      : null)
  );
}

async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  customerId: string | null
) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return false;

  const supabase = createServiceClient();
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
    incomplete: "inactive",
    incomplete_expired: "cancelled",
    paused: "inactive",
  };

  const status = statusMap[subscription.status] ?? "inactive";
  const isActive = status === "active" || status === "trialing";
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  await supabase.from("platform_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  await supabase
    .from("profiles")
    .update({ is_supporter: isActive, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return isActive;
}

export async function fulfillSupporterCheckoutSession(
  sessionId: string
): Promise<{ synced: boolean; isActive: boolean }> {
  if (!isStripeConfigured()) {
    return { synced: false, isActive: false };
  }

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.mode !== "subscription" || !session.subscription) {
    return { synced: false, isActive: false };
  }

  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const subscription = await getStripe().subscriptions.retrieve(subId);
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const isActive = await syncSubscriptionFromStripe(subscription, customerId);
  return { synced: true, isActive: Boolean(isActive) };
}
