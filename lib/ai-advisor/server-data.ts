import type { AdvisorRequestBody } from "@/lib/ai-advisor/types";
import {
  buildAlertasAdvisorInsights,
  buildCampanasAdvisorInsights,
  buildCashflowAdvisorInsights,
  buildDashboardAdvisorInsights,
  buildProductosAdvisorInsights,
  buildRentabilidadAdvisorInsights,
  type AdvisorInsights,
} from "@/lib/ai-advisor-insights";
import { filterOrdersByRange, filterOrdersByStore } from "@/lib/dashboard-filters";
import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import {
  applyStarterMonthlyOrderCap,
  filterCampaignsByStoreAndAds,
  mockCampaigns,
  mockOrders,
} from "@/lib/mock-data";
import { filterCampaignsByPlanHistory, filterOrdersByPlanHistory } from "@/lib/plan-features";
import { listAlertHistory } from "@/lib/server/user-alerts";
import type { Campaign, Order, Plan } from "@/types";

export type AdvisorDataBundle = {
  orders: Order[];
  campaigns: Campaign[];
  ruleInsights: AdvisorInsights;
  alertHistory: { message: string; alert_type: string; read: boolean }[];
};

export async function loadAdvisorDataForUser(
  userId: string,
  plan: Plan,
  body: AdvisorRequestBody
): Promise<AdvisorDataBundle> {
  const live = await loadLiveDashboardData(userId);
  let orders = filterOrdersByPlanHistory(live.orders, plan);
  let campaigns = filterCampaignsByPlanHistory(live.campaigns, plan);
  orders = applyStarterMonthlyOrderCap(orders, plan);

  const storeScope = body.storeScope ?? "all";
  const storeId = storeScope === "all" ? null : storeScope;
  orders = filterOrdersByStore(orders, storeId);

  if (body.dateRange) {
    orders = filterOrdersByRange(orders, body.dateRange, body.customRange ?? null);
  }

  if (body.page === "campanas" && body.adsPlatform) {
    campaigns = filterCampaignsByStoreAndAds(campaigns, storeScope, body.adsPlatform);
  } else if (storeScope !== "all") {
    campaigns = campaigns.filter((c) => c.store_id === storeScope);
  }

  const alertHistoryRows = body.page === "alertas" ? await listAlertHistory(userId) : [];
  const alertHistory = alertHistoryRows.map((h) => ({
    message: h.message,
    alert_type: h.alert_type,
    read: h.read,
  }));

  const ruleInsights = buildRuleInsights(body, orders, campaigns, alertHistory);

  return { orders, campaigns, ruleInsights, alertHistory };
}

export function loadAdvisorDataDemo(body: AdvisorRequestBody): AdvisorDataBundle {
  const storeScope = body.storeScope ?? "all";
  const storeId = storeScope === "all" ? null : storeScope;
  let orders = filterOrdersByStore(mockOrders, storeId);
  if (body.dateRange) {
    orders = filterOrdersByRange(orders, body.dateRange, body.customRange ?? null);
  }

  let campaigns = mockCampaigns;
  if (body.page === "campanas" && body.adsPlatform) {
    campaigns = filterCampaignsByStoreAndAds(mockCampaigns, storeScope, body.adsPlatform);
  } else if (storeScope !== "all") {
    campaigns = campaigns.filter((c) => c.store_id === storeScope);
  }

  const ruleInsights = buildRuleInsights(body, orders, campaigns, []);
  return { orders, campaigns, ruleInsights, alertHistory: [] };
}

function buildRuleInsights(
  body: AdvisorRequestBody,
  orders: Order[],
  campaigns: Campaign[],
  alertHistory: { message: string; alert_type: string; read: boolean }[]
): AdvisorInsights {
  const storeScope = body.storeScope ?? "all";

  switch (body.page) {
    case "dashboard":
      return buildDashboardAdvisorInsights(orders, storeScope, campaigns);
    case "campanas":
      return buildCampanasAdvisorInsights(
        storeScope,
        body.adsPlatform ?? "meta",
        campaigns
      );
    case "rentabilidad":
      return buildRentabilidadAdvisorInsights(orders);
    case "cashflow":
      return buildCashflowAdvisorInsights(orders);
    case "productos":
      return buildProductosAdvisorInsights(orders);
    case "alertas":
      return buildAlertasAdvisorInsights(alertHistory);
    default:
      return buildDashboardAdvisorInsights(orders, storeScope, campaigns);
  }
}
