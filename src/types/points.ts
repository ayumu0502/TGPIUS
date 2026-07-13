export const PURCHASE_AMOUNTS = [
  1000, 3000, 5000, 10000, 30000, 50000, 100000,
] as const;

export type PurchaseAmount = (typeof PURCHASE_AMOUNTS)[number];

export type PointTransaction = {
  id: string;
  amount: PurchaseAmount;
  transaction_type: "purchase";
  payment_method: "test" | "stripe";
  created_at: string;
  amount_yen?: number | null;
  payment_status?: string | null;
};

export type PointPurchaseState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"amount", string>>;
};
