import { DODO_PRODUCT_IDS } from "@/lib/dodo-products";
import type { Plan } from "@/types";

export type BillingTier = "growth" | "scale";
export type BillingStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "on_hold"
  | "cancelled";

export type UserBillingMeta = {
  selected_plan?: string;
  billing_annual?: boolean;
  billing_status?: BillingStatus;
  billing_plan?: BillingTier;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  dodo_subscription_id?: string | null;
  dodo_customer_id?: string | null;
  dodo_product_id?: string | null;
  last_dodo_event?: string | null;
  last_dodo_sync_at?: string | null;
};

const PRO_IDS = new Set<string>([DODO_PRODUCT_IDS.pro.monthly, DODO_PRODUCT_IDS.pro.annual]);
const SCALE_IDS = new Set<string>([
  DODO_PRODUCT_IDS.scale.monthly,
  DODO_PRODUCT_IDS.scale.annual,
]);

export function planTierFromProductId(productId: string | null | undefined): BillingTier | null {
  if (!productId) return null;
  if (SCALE_IDS.has(productId)) return "scale";
  if (PRO_IDS.has(productId)) return "growth";
  return null;
}

export function billingAnnualFromProductId(productId: string | null | undefined): boolean {
  if (!productId) return true;
  return productId === DODO_PRODUCT_IDS.pro.annual || productId === DODO_PRODUCT_IDS.scale.annual;
}

export function planFromBillingMeta(meta: UserBillingMeta | null | undefined): Plan {
  const status = meta?.billing_status ?? "none";
  const trialEnds = meta?.trial_ends_at ? Date.parse(meta.trial_ends_at) : NaN;
  const trialExpired =
    status === "trialing" && Number.isFinite(trialEnds) && Date.now() >= trialEnds;

  if (!trialExpired && (status === "active" || status === "trialing")) {
    if (meta?.billing_plan === "scale") return "scale";
    return "growth";
  }

  if (meta?.selected_plan === "scale") return "scale";
  if (meta?.selected_plan === "pro" || meta?.selected_plan === "growth") return "growth";
  return "starter";
}

export function computeTrialEndsAt(createdAtIso: string, trialPeriodDays: number): string | null {
  if (!trialPeriodDays || trialPeriodDays <= 0) return null;
  const start = Date.parse(createdAtIso);
  if (!Number.isFinite(start)) return null;
  return new Date(start + trialPeriodDays * 24 * 60 * 60 * 1000).toISOString();
}

export function defaultTrialEndsAt(days = 7): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}
