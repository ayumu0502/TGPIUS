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
