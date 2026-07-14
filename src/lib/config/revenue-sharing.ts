/**
 * Revenue sharing & payout configuration — NOT FINALIZED
 *
 * The following are intentionally NOT implemented as fixed product rules:
 * - Athlete vs operator fixed split (e.g. 40% / 60%)
 * - Stripe Connect / automatic payouts
 * - Performance-based rewards
 * - Per-contract reward management
 *
 * Update these values only after business/legal spec is approved.
 */

/** Provisional platform fee on point purchases (Stripe). Env override allowed. */
export const PROVISIONAL_STRIPE_PLATFORM_FEE_RATE = Number(
  process.env.STRIPE_PLATFORM_FEE_RATE ?? "0.1"
);

/**
 * Provisional gift platform fee ratio used in send_gift RPC.
 * TODO: replace with configurable revenue-sharing module when spec is fixed.
 */
export const PROVISIONAL_GIFT_PLATFORM_FEE_RATE = 0.1;

export function provisionalGiftPlatformFee(amount: number): number {
  return Math.floor(amount * PROVISIONAL_GIFT_PLATFORM_FEE_RATE);
}
