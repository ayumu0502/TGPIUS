import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export type StripeSupabase = {
  client: SupabaseClient;
  mode: "service" | "user";
};

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export async function getStripeSupabase(): Promise<StripeSupabase> {
  if (hasServiceRoleKey()) {
    return { client: createServiceClient(), mode: "service" };
  }
  return { client: await createServerClient(), mode: "user" };
}

export function getStripeSupabaseSync(): StripeSupabase {
  if (hasServiceRoleKey()) {
    return { client: createServiceClient(), mode: "service" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured");
  }

  return {
    client: createSupabaseClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    mode: "user",
  };
}
