import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getStripeSupabase, hasServiceRoleKey } from "@/lib/supabase/stripe-db";

let checkoutRpcAvailable: boolean | null = null;

export async function hasStripeCheckoutUserRpc(): Promise<boolean> {
  if (hasServiceRoleKey()) return true;
  if (checkoutRpcAvailable !== null) return checkoutRpcAvailable;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    checkoutRpcAvailable = false;
    return false;
  }

  const supabase = createSupabaseClient(url, anonKey);
  const { error } = await supabase.rpc("init_stripe_payment", {
    p_point_amount: 1000,
    p_amount_total: 1000,
    p_platform_fee: 100,
    p_net_amount: 900,
    p_metadata: {},
  });

  checkoutRpcAvailable = Boolean(
    error && !error.message.toLowerCase().includes("could not find the function")
  );
  return checkoutRpcAvailable;
}

export async function canUseStripePaymentRecords(): Promise<boolean> {
  return hasServiceRoleKey() || (await hasStripeCheckoutUserRpc());
}

export async function getStripeSupabaseForCheckout() {
  return getStripeSupabase();
}
