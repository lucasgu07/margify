import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type { CostsConfigInput } from "@/lib/server/user-costs";
import { defaultCostsInput } from "@/lib/server/user-costs";

export async function readCostsFromDb(userId: string): Promise<CostsConfigInput | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("user_costs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    product_cost_percent: Number(data.product_cost_percent),
    payment_commission_percent: Number(data.payment_commission_percent),
    shipping_cost_fixed: Number(data.shipping_cost_fixed),
    agency_fee_percent: Number(data.agency_fee_percent),
  };
}

export async function writeCostsToDb(userId: string, input: CostsConfigInput): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("user_costs").upsert(
    {
      user_id: userId,
      product_cost_percent: input.product_cost_percent,
      payment_commission_percent: input.payment_commission_percent,
      shipping_cost_fixed: input.shipping_cost_fixed,
      agency_fee_percent: input.agency_fee_percent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return !error;
}

export { defaultCostsInput };
