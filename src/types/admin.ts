import type { AccountType } from "@/types/auth";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  account_type: AccountType;
  is_suspended: boolean;
  is_admin: boolean;
  point_balance: number;
  created_at: string;
};

export type AdminStats = {
  totalUsers: number;
  athleteCount: number;
  sponsorCount: number;
  fanCount: number;
  totalRevenue: number;
  platformFeeTotal: number;
  netRevenue: number;
  giftCount: number;
  purchaseCount: number;
  giftRevenue: number;
  subscriptionRevenue: number;
  failedPaymentCount: number;
  refundTotal: number;
};

export type AdminBillingRecord = {
  id: string;
  user_name: string;
  record_type: string;
  amount_yen: number;
  status: string;
  description: string;
  created_at: string;
};

export type AdminAthleteEarning = {
  athlete_id: string;
  athlete_name: string;
  gift_net: number;
  gift_count: number;
  total_earnings: number;
};

export type AdminPointPurchase = {
  id: string;
  user_name: string;
  user_email: string;
  amount: number;
  payment_method: string;
  created_at: string;
};

export type AdminPayment = {
  id: string;
  user_name: string;
  user_email: string;
  point_amount: number;
  amount_total: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
};

export type AdminGift = {
  id: string;
  sender_name: string;
  receiver_name: string;
  amount: number;
  message: string;
  created_at: string;
};

export type AdminActionState = {
  error?: string;
  success?: string;
};

export type AdminReport = {
  id: string;
  reporter_name: string;
  reported_name: string;
  reason: string;
  context_type: string;
  status: string;
  created_at: string;
};

export type AdminBlock = {
  id: string;
  blocker_name: string;
  blocked_name: string;
  created_at: string;
};

export type AdminPost = {
  id: string;
  user_name: string;
  caption: string;
  media_type: string;
  created_at: string;
};

export type AdminComment = {
  id: string;
  user_name: string;
  post_id: string;
  content: string;
  created_at: string;
};

export type AdminEvent = {
  id: string;
  creator_name: string;
  title: string;
  starts_at: string;
  status: string;
  capacity: number;
  fee_points: number;
};

export type AdminExclusivePost = {
  id: string;
  athlete_name: string;
  title: string;
  post_type: string;
  is_members_only: boolean;
  created_at: string;
};

export type AdminAuditEntry = {
  id: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string | null;
  note: string;
  created_at: string;
};

export type AdminRefund = {
  id: string;
  user_name: string;
  amount_yen: number;
  description: string;
  created_at: string;
};
