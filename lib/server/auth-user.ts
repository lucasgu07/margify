import { planFromBillingMeta, type UserBillingMeta } from "@/lib/dodo-billing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Plan } from "@/types";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  plan: Plan;
  billing: UserBillingMeta;
};

export function getUserBillingFromMetadata(
  meta: Record<string, unknown> | undefined
): UserBillingMeta {
  if (!meta) return {};
  return {
    selected_plan: meta.selected_plan as string | undefined,
    billing_annual: meta.billing_annual as boolean | undefined,
    billing_status: meta.billing_status as UserBillingMeta["billing_status"],
    billing_plan: meta.billing_plan as UserBillingMeta["billing_plan"],
    trial_ends_at: meta.trial_ends_at as string | null | undefined,
    current_period_end: meta.current_period_end as string | null | undefined,
    dodo_subscription_id: meta.dodo_subscription_id as string | null | undefined,
    dodo_customer_id: meta.dodo_customer_id as string | null | undefined,
    dodo_product_id: meta.dodo_product_id as string | null | undefined,
    last_dodo_event: meta.last_dodo_event as string | null | undefined,
    last_dodo_sync_at: meta.last_dodo_sync_at as string | null | undefined,
  };
}

/** Usuario autenticado vía Supabase (null si no hay sesión o Supabase no configurado). */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const u = data.user;
  const rawMeta = u.user_metadata as Record<string, unknown> | undefined;
  const billing = getUserBillingFromMetadata(rawMeta);
  const fromMeta =
    typeof rawMeta?.full_name === "string" && rawMeta.full_name.trim()
      ? rawMeta.full_name.trim()
      : null;
  return {
    id: u.id,
    email: u.email ?? "",
    full_name: fromMeta ?? u.email?.split("@")[0] ?? "Usuario",
    plan: planFromBillingMeta(billing),
    billing,
  };
}
