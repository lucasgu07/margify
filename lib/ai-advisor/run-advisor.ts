import {
  buildFallbackRecommendations,
  computeAdvisorMetrics,
  filterOrdersLast30Days,
} from "@/lib/ai-advisor/compute-metrics";
import { generateClaudeRecommendations } from "@/lib/ai-advisor/generate-claude";
import {
  ADVISOR_DATA_DAYS,
  ADVISOR_REFRESH_MS,
  type AdvisorApiResponse,
  type AdvisorApiSuccess,
  type AdvisorRecommendation,
  type AdvisorSource,
} from "@/lib/ai-advisor/recommendation-types";
import {
  getLatestRecommendations,
  saveRecommendations,
} from "@/lib/ai-advisor/recommendations-store";
import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import {
  applyStarterMonthlyOrderCap,
  mockCampaigns,
  mockOrders,
} from "@/lib/mock-data";
import { filterCampaignsByPlanHistory, filterOrdersByPlanHistory } from "@/lib/plan-features";
import { listAlertHistory } from "@/lib/server/user-alerts";
import { readCostsForUserAsync } from "@/lib/server/user-costs";
import type { Plan } from "@/types";

const MIN_ORDERS = 10;

function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

async function resolveRecommendations(metrics: ReturnType<typeof computeAdvisorMetrics>): Promise<{
  recommendations: AdvisorRecommendation[];
  motivationalClose?: string;
  source: AdvisorSource;
}> {
  const fallback = buildFallbackRecommendations(metrics);

  if (!isClaudeConfigured()) {
    return { recommendations: fallback, source: "fallback" };
  }

  try {
    const claude = await generateClaudeRecommendations(metrics);
    return {
      recommendations: claude.recommendations,
      motivationalClose: claude.motivationalClose,
      source: "claude",
    };
  } catch (err) {
    console.error("[ai-advisor] Claude falló, usando fallback:", err);
    return { recommendations: fallback, source: "fallback" };
  }
}

function isStale(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() >= ADVISOR_REFRESH_MS;
}

export async function runAdvisorForUser(
  userId: string,
  plan: Plan,
  options: { force?: boolean; useCache?: boolean } = {}
): Promise<AdvisorApiResponse> {
  const { force = false, useCache = true } = options;

  if (useCache && !force) {
    const cached = await getLatestRecommendations(userId);
    if (cached && !isStale(cached.created_at)) {
      return {
        recommendations: cached.recommendations,
        generatedAt: cached.created_at,
        dataFromDays: ADVISOR_DATA_DAYS,
        motivationalClose: cached.motivational_close ?? undefined,
        source: "cache",
        claudeConfigured: isClaudeConfigured(),
      };
    }
  }

  const live = await loadLiveDashboardData(userId);
  const costs = await readCostsForUserAsync(userId);
  await listAlertHistory(userId, 10);

  let orders = filterOrdersByPlanHistory(live.orders, plan);
  orders = applyStarterMonthlyOrderCap(orders, plan);
  orders = filterOrdersLast30Days(orders);

  let campaigns = filterCampaignsByPlanHistory(live.campaigns, plan).filter(
    (c) => c.status === "active"
  );

  const metrics = computeAdvisorMetrics(orders, campaigns, costs, live.integrations);

  if (!metrics.hasStoreConnected && metrics.orderCount === 0) {
    return {
      status: "no_store",
      message: "Conectá tu tienda para que Margify AI pueda analizar tus datos.",
    };
  }

  if (metrics.orderCount < MIN_ORDERS) {
    return {
      status: "insufficient_data",
      orderCount: metrics.orderCount,
      message: `Necesitamos al menos ${MIN_ORDERS} órdenes en 30 días para un análisis confiable. Tenés ${metrics.orderCount}.`,
    };
  }

  const { recommendations, motivationalClose, source } = await resolveRecommendations(metrics);

  const generatedAt =
    (await saveRecommendations(userId, recommendations, motivationalClose)) ??
    new Date().toISOString();

  return {
    recommendations,
    generatedAt,
    dataFromDays: ADVISOR_DATA_DAYS,
    motivationalClose,
    source,
    claudeConfigured: isClaudeConfigured(),
  };
}

export async function runAdvisorDemo(): Promise<AdvisorApiSuccess> {
  const orders = filterOrdersLast30Days(mockOrders);
  const campaigns = mockCampaigns.filter((c) => c.status === "active");
  const metrics = computeAdvisorMetrics(
    orders,
    campaigns,
    {
      product_cost_percent: 40,
      payment_commission_percent: 3.5,
      shipping_cost_fixed: 5,
      agency_fee_percent: 0,
    },
    { shopify: true, tiendanube: true, mercadolibre: false, meta: true, google: true, tiktok: false }
  );

  const { recommendations, motivationalClose, source } = await resolveRecommendations(metrics);

  return {
    recommendations,
    generatedAt: new Date().toISOString(),
    dataFromDays: ADVISOR_DATA_DAYS,
    motivationalClose,
    source,
    claudeConfigured: isClaudeConfigured(),
  };
}

export function shouldRefreshClient(generatedAt: string | null): boolean {
  if (!generatedAt) return true;
  return isStale(generatedAt);
}
