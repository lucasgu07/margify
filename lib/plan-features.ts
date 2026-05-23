import type { Plan } from "@/types";
import type { Campaign, Order } from "@/types";

/** Consultas Margify AI incluidas por mes (null = ilimitadas). */
export function aiMonthlyLimit(plan: Plan): number | null {
  if (plan === "starter") return 0;
  if (plan === "growth") return 15;
  return null;
}

export function canUseMargifyAI(plan: Plan): boolean {
  return plan !== "starter";
}

export function canUseWhatsAppAlerts(plan: Plan): boolean {
  return plan === "growth" || plan === "scale" || plan === "agency";
}

export function canUseApiAccess(plan: Plan): boolean {
  return plan === "growth" || plan === "scale" || plan === "agency";
}

/** Días de historial visible (null = ilimitado). */
export function historyDaysLimit(plan: Plan): number | null {
  if (plan === "starter") return 31;
  return null;
}

export function historyCutoffIso(plan: Plan): string | null {
  const days = historyDaysLimit(plan);
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function filterOrdersByPlanHistory(orders: Order[], plan: Plan): Order[] {
  const cutoff = historyCutoffIso(plan);
  if (!cutoff) return orders;
  return orders.filter((o) => o.date >= cutoff);
}

export function filterCampaignsByPlanHistory(campaigns: Campaign[], plan: Plan): Campaign[] {
  const cutoff = historyCutoffIso(plan);
  if (!cutoff) return campaigns;
  return campaigns.filter((c) => !c.date || c.date >= cutoff);
}

export function planDisplayName(plan: Plan): string {
  switch (plan) {
    case "starter":
      return "Gratis";
    case "growth":
      return "Pro";
    case "scale":
      return "Scale";
    case "agency":
      return "Agency";
    default:
      return plan;
  }
}
