export type PlatformSubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "cancelled"
  | "trialing";

export type PlatformSubscription = {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  status: PlatformSubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type SubscriptionState = {
  error?: string;
  success?: string;
};

export type PayoutRequestStatus =
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "rejected";

export type PayoutRequest = {
  id: string;
  user_id: string;
  amount: number;
  status: PayoutRequestStatus;
  stripe_transfer_id: string | null;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  athlete_name?: string;
};

export type ConnectAccount = {
  user_id: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
};

export type PayoutState = {
  error?: string;
  success?: string;
};

/** @deprecated Use PayoutState */
export type ConnectState = PayoutState;

export type BillingRecord = {
  id: string;
  record_type: "subscription_invoice" | "payment_failed" | "point_purchase" | "refund";
  amount_yen: number;
  status: "paid" | "failed" | "refunded" | "pending";
  description: string;
  stripe_invoice_id: string | null;
  created_at: string;
};

export type AthleteEarningsSummary = {
  giftGross: number;
  giftNet: number;
  giftCount: number;
  subscriptionNet: number;
  totalEarnings: number;
  availableBalance: number;
  pendingPayout: number;
  settledPayout: number;
};
