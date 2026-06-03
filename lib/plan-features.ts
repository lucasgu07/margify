import type { Plan } from "@/types";
import type { Campaign, Order } from "@/types";

// ─── AI / Margify AI ──────────────────────────────────────────────────────────

/** Monthly Margify AI chat queries (null = unlimited). */
export function aiMonthlyLimit(plan: Plan): number | null {
  if (plan === "starter") return 0;
  if (plan === "growth") return 15;
  return null; // scale, agency
}

export function canUseMargifyAI(plan: Plan): boolean {
  return plan !== "starter";
}

/** Full AI Advisor access: 4-7 insights per analysis (starter = 3 max). */
export function canUseFullAIAdvisor(plan: Plan): boolean {
  return plan !== "starter";
}

/** Automated weekly AI review (Scale+ only). */
export function canUseWeeklyAIReview(plan: Plan): boolean {
  return plan === "scale" || plan === "agency";
}

/** AI action simulation "what if" scenarios (Scale+ only). */
export function canUseAISimulation(plan: Plan): boolean {
  return plan === "scale" || plan === "agency";
}

// ─── Inventory ────────────────────────────────────────────────────────────────

/** Inventory intelligence page and stock forecasting (Pro+). */
export function canUseInventoryIntelligence(plan: Plan): boolean {
  return plan !== "starter";
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function canUseWhatsAppAlerts(plan: Plan): boolean {
  return plan === "growth" || plan === "scale" || plan === "agency";
}

/** Advanced alert rules with custom thresholds (Scale+ only). */
export function canUseAdvancedAlerts(plan: Plan): boolean {
  return plan === "scale" || plan === "agency";
}

// ─── API ──────────────────────────────────────────────────────────────────────

export function canUseApiAccess(plan: Plan): boolean {
  return plan === "growth" || plan === "scale" || plan === "agency";
}

// ─── Data history ─────────────────────────────────────────────────────────────

/** Days of order/campaign history visible (null = unlimited). */
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

// ─── Collaboration / white-label ──────────────────────────────────────────────

/** Multi-client access and team management (Scale+). */
export function canUseMultiClient(plan: Plan): boolean {
  return plan === "scale" || plan === "agency";
}

/** White-label reports (Scale+). */
export function canUseWhiteLabel(plan: Plan): boolean {
  return plan === "scale" || plan === "agency";
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function planDisplayName(plan: Plan): string {
  switch (plan) {
    case "starter": return "Gratis";
    case "growth":  return "Pro";
    case "scale":   return "Scale";
    case "agency":  return "Agency";
    default:        return plan;
  }
}

export function planTagline(plan: Plan): string {
  switch (plan) {
    case "starter": return "Explorá tu negocio";
    case "growth":  return "Operá con inteligencia";
    case "scale":   return "Escalá con IA ilimitada";
    case "agency":  return "Gestión multi-cliente";
    default:        return "";
  }
}
