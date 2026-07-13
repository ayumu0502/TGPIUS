export const GIFT_AMOUNTS = [100, 300, 500, 1000, 3000, 10000] as const;

export type GiftAmount = (typeof GIFT_AMOUNTS)[number];

export type GiftAthleteSummary = {
  id: string;
  name: string;
  sport: string;
  avatar_url: string | null;
};

export type GiftRecord = {
  id: string;
  amount: GiftAmount;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  receiver_name: string;
  sender_sport?: string;
  receiver_sport?: string;
};

export type GiftSendState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"amount" | "message", string>>;
};

export type GiftStats = {
  totalReceived: number;
  giftCount: number;
  pointBalance: number;
};
