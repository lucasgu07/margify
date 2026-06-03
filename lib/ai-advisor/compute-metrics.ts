import { isoDateLocal } from "@/lib/dashboard-filters";
import {
  buildCashflowEntries,
  buildProductProfits,
  cashflowSummary,
  getDashboardMetrics,
} from "@/lib/mock-data";
import type { Campaign, Order } from "@/types";
import type { CostsConfigInput } from "@/lib/server/user-costs";

// ─── Row types ────────────────────────────────────────────────────────────────

export type CampaignMetricRow = {
  name: string;
  spend: number;
  realRoas: number;
  conversions: number;
  daysWithoutConversion: number;
  lowRoas: boolean;
  staleSpendNoConv: boolean;
  /** Estimated money wasted per week on this campaign. */
  estimatedWeeklyWaste: number;
};

export type ProductMetricRow = {
  name: string;
  margin: number;
  unitsSold: number;
  revenue: number;
  minPriceHint?: number;
};

// ─── Payload type ─────────────────────────────────────────────────────────────

export type AdvisorMetricsPayload = {
  // ── Core metrics ──────────────────────────────────────────────────────────
  totalRevenue: number;
  netProfit: number;
  avgMargin: number;
  campaigns: CampaignMetricRow[];
  bestProducts: ProductMetricRow[];
  worstProducts: ProductMetricRow[];
  projectedCashflow: number;
  orderCount: number;
  hasStoreConnected: boolean;

  // ── Enhanced metrics (used by the new Claude prompt) ──────────────────────
  /** Marketing Efficiency Ratio = totalRevenue / totalAdSpend */
  mer: number;
  /** Blended CAC = totalAdSpend / orderCount */
  blendedCac: number;
  /** Sum of all active campaign spends. */
  totalAdSpend: number;
  /** Spend on campaigns with ROAS < 1.0 (money clearly burned). */
  wastedSpend: number;
  /** The single worst ROAS campaign by absolute waste. */
  topWastedCampaign?: CampaignMetricRow;
  /** % change in avg ROAS comparing last 7 days vs prior 7 days. */
  roasTrendPct: number;
  /** % change in revenue comparing last 15 days vs prior 15 days. */
  revenueGrowthPct: number;
  /** Number of products with margin < 10%. */
  lowMarginProductCount: number;
  /** Low-margin products that are also high-volume (risky). */
  highVolumeButLowMarginProducts: ProductMetricRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cutoff30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return isoDateLocal(d);
}

function cutoffDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDateLocal(d);
}

export function filterOrdersLast30Days(orders: Order[]): Order[] {
  const from = cutoff30Days();
  return orders.filter((o) => o.date >= from && o.status !== "cancelled");
}

export function hasConnectedStore(integrations: {
  shopify: boolean;
  tiendanube: boolean;
  mercadolibre: boolean;
  meta: boolean;
  google: boolean;
  tiktok?: boolean;
}): boolean {
  return (
    integrations.shopify ||
    integrations.tiendanube ||
    integrations.mercadolibre ||
    integrations.meta ||
    integrations.google ||
    Boolean(integrations.tiktok)
  );
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
}

function avgRoasForPeriod(campaigns: Campaign[], from: string, to: string): number {
  const slice = campaigns.filter((c) => c.date >= from && c.date < to && c.spend > 0);
  if (!slice.length) return 0;
  const totalSpend = slice.reduce((s, c) => s + c.spend, 0);
  const totalRev = slice.reduce((s, c) => s + c.attributed_revenue, 0);
  return totalSpend > 0 ? totalRev / totalSpend : 0;
}

function revenueForPeriod(orders: Order[], from: string, to: string): number {
  return orders
    .filter((o) => o.date >= from && o.date < to && o.status !== "cancelled")
    .reduce((s, o) => s + o.revenue, 0);
}

// ─── Main compute function ────────────────────────────────────────────────────

export function computeAdvisorMetrics(
  orders: Order[],
  campaigns: Campaign[],
  costs: CostsConfigInput,
  integrations: Parameters<typeof hasConnectedStore>[0]
): AdvisorMetricsPayload {
  const periodOrders = filterOrdersLast30Days(orders);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const m = getDashboardMetrics(periodOrders, null, campaigns);

  // ── Campaign rows ──────────────────────────────────────────────────────────
  const campaignRows: CampaignMetricRow[] = activeCampaigns.map((c) => {
    const realRoas = c.spend > 0 ? c.attributed_revenue / c.spend : 0;
    const conv = c.conversions ?? 0;
    const daysWithoutConversion =
      conv > 0 ? 0 : Math.max(3, daysSince(c.date || cutoff30Days()));
    // Weekly waste: if ROAS < 1.5, rough weekly cost of underperformance
    const weeklyWaste =
      realRoas > 0 && realRoas < 1.5
        ? ((c.spend / 30) * 7) * (1 - realRoas / 1.5)
        : 0;
    return {
      name: c.campaign_name,
      spend: c.spend,
      realRoas,
      conversions: conv,
      daysWithoutConversion,
      lowRoas: realRoas > 0 && realRoas < 1.5,
      staleSpendNoConv: c.spend > 150 && conv === 0 && daysWithoutConversion >= 3,
      estimatedWeeklyWaste: Math.max(0, weeklyWaste),
    };
  });

  // ── Product rows ───────────────────────────────────────────────────────────
  const products = buildProductProfits(periodOrders);
  const sorted = [...products].sort((a, b) => b.margin_percent - a.margin_percent);

  const mapProduct = (p: (typeof products)[0]): ProductMetricRow => {
    let minPriceHint: number | undefined;
    if (p.margin_percent < 0 && p.units_sold > 0) {
      const costPerUnit =
        (periodOrders
          .filter((o) => o.product_name === p.name)
          .reduce(
            (s, o) =>
              s +
              o.product_cost +
              o.shipping_cost +
              o.payment_commission +
              (o.ads_spend_attributed ?? 0),
            0
          ) || 0) / p.units_sold;
      minPriceHint = costPerUnit * 1.15;
    }
    return {
      name: p.name,
      margin: p.margin_percent,
      unitsSold: p.units_sold,
      revenue: p.revenue,
      minPriceHint,
    };
  };

  const bestProducts = sorted.slice(0, 3).map(mapProduct);
  const worstProducts = [...sorted].reverse().slice(0, 3).map(mapProduct);
  const allProductRows = sorted.map(mapProduct);

  // ── Cashflow ───────────────────────────────────────────────────────────────
  const cashflow = cashflowSummary(buildCashflowEntries(periodOrders));

  // ── Enhanced metrics ───────────────────────────────────────────────────────
  const totalAdSpend = activeCampaigns.reduce((s, c) => s + c.spend, 0);
  const mer = totalAdSpend > 0 ? m.totalSales / totalAdSpend : 0;
  const blendedCac = periodOrders.length > 0 ? totalAdSpend / periodOrders.length : 0;

  const wastedSpend = activeCampaigns
    .filter((c) => (c.spend > 0 ? c.attributed_revenue / c.spend : 0) < 1.0)
    .reduce((s, c) => s + c.spend, 0);

  const topWastedCampaignRow = campaignRows
    .filter((r) => r.estimatedWeeklyWaste > 0)
    .sort((a, b) => b.estimatedWeeklyWaste - a.estimatedWeeklyWaste)[0];

  // ROAS trend: last 7 vs prior 7 days
  const today = isoDateLocal(new Date());
  const d7 = cutoffDaysAgo(7);
  const d14 = cutoffDaysAgo(14);
  const roasLast7 = avgRoasForPeriod(campaigns, d7, today);
  const roasPrior7 = avgRoasForPeriod(campaigns, d14, d7);
  const roasTrendPct =
    roasPrior7 > 0 ? ((roasLast7 - roasPrior7) / roasPrior7) * 100 : 0;

  // Revenue growth: last 15 vs prior 15 days
  const d15 = cutoffDaysAgo(15);
  const revLast15 = revenueForPeriod(orders, d15, today);
  const revPrior15 = revenueForPeriod(orders, cutoffDaysAgo(30), d15);
  const revenueGrowthPct =
    revPrior15 > 0 ? ((revLast15 - revPrior15) / revPrior15) * 100 : 0;

  const lowMarginProductCount = allProductRows.filter((p) => p.margin < 10).length;
  const highVolumeButLowMarginProducts = allProductRows.filter(
    (p) => p.margin < 10 && p.unitsSold >= 20
  );

  return {
    totalRevenue: m.totalSales,
    netProfit: m.netProfit,
    avgMargin: m.marginPercent,
    campaigns: campaignRows,
    bestProducts,
    worstProducts,
    projectedCashflow: cashflow.nextWeek,
    orderCount: periodOrders.length,
    hasStoreConnected: hasConnectedStore(integrations),
    mer,
    blendedCac,
    totalAdSpend,
    wastedSpend,
    topWastedCampaign: topWastedCampaignRow,
    roasTrendPct,
    revenueGrowthPct,
    lowMarginProductCount,
    highVolumeButLowMarginProducts,
  };
}

// ─── Fallback recommendations (no Claude) ────────────────────────────────────

export function buildFallbackRecommendations(
  metrics: AdvisorMetricsPayload
): import("@/lib/ai-advisor/recommendation-types").AdvisorRecommendation[] {
  const recs: import("@/lib/ai-advisor/recommendation-types").AdvisorRecommendation[] = [];

  // Worst ROAS campaign
  const worstCamp = metrics.campaigns
    .filter((c) => c.lowRoas && c.spend > 200)
    .sort((a, b) => b.estimatedWeeklyWaste - a.estimatedWeeklyWaste)[0];
  if (worstCamp) {
    recs.push({
      title: "Pausá campaña sangrante",
      problem: `"${worstCamp.name}" tiene ROAS real ${worstCamp.realRoas.toFixed(2)}x con $${worstCamp.spend.toFixed(0)} de gasto.`,
      action: `→ Pausala hoy en Ads Manager y redirigí ese presupuesto a una campaña con ROAS > 2x.`,
      impact: `Podés dejar de quemar ~$${Math.max(50, worstCamp.estimatedWeeklyWaste).toFixed(0)} por semana.`,
      type: "danger",
      category: "Ads",
      confidence: 85,
      urgency: "high",
      estimatedImpactUsd: Math.max(50, worstCamp.estimatedWeeklyWaste) * 4,
      dataPoints: [
        `ROAS: ${worstCamp.realRoas.toFixed(2)}x`,
        `Gasto total: $${worstCamp.spend.toFixed(0)}`,
        `Conversiones: ${worstCamp.conversions}`,
      ],
    });
  }

  // Stale campaign
  const stale = metrics.campaigns.find((c) => c.staleSpendNoConv);
  if (stale && recs.length < 5) {
    const dailyCost = stale.spend / Math.max(stale.daysWithoutConversion, 3);
    recs.push({
      title: "Campaña sin conversiones",
      problem: `"${stale.name}" lleva ${stale.daysWithoutConversion}+ días gastando sin conversiones verificadas.`,
      action: "→ Revisá pixel, landing y creativos. Si no mejoran en 48 h, bajá presupuesto 50%.",
      impact: `Cada día activa puede costarte $${dailyCost.toFixed(0)} sin retorno.`,
      type: "warning",
      category: "Ads",
      confidence: 80,
      urgency: "high",
      estimatedImpactUsd: dailyCost * 30,
      dataPoints: [
        `Días sin conversiones: ${stale.daysWithoutConversion}`,
        `Gasto total: $${stale.spend.toFixed(0)}`,
      ],
    });
  }

  // Low-margin high-volume product
  const badProduct = metrics.highVolumeButLowMarginProducts[0] ?? metrics.worstProducts.find((p) => p.margin < 5);
  if (badProduct && recs.length < 5) {
    const monthlyImpact = badProduct.unitsSold * Math.abs(badProduct.margin / 100) * (badProduct.revenue / Math.max(badProduct.unitsSold, 1));
    recs.push({
      title: "Producto con margen negativo",
      problem: `"${badProduct.name}" margen ${badProduct.margin.toFixed(1)}% en ${badProduct.unitsSold} ventas. Cada venta te cuesta plata.`,
      action: badProduct.minPriceHint
        ? `→ Subí precio mínimo a ~$${badProduct.minPriceHint.toFixed(0)} o bajá costo de envío/comisión.`
        : "→ Revisá costo de producto y envío en Configuración.",
      impact: `Perdés ~$${Math.max(50, monthlyImpact).toFixed(0)} al mes en este producto.`,
      type: "warning",
      category: "Profitability",
      confidence: 88,
      urgency: "high",
      estimatedImpactUsd: Math.max(50, monthlyImpact),
      dataPoints: [
        `Margen: ${badProduct.margin.toFixed(1)}%`,
        `Unidades vendidas: ${badProduct.unitsSold}`,
        `Revenue: $${badProduct.revenue.toFixed(0)}`,
      ],
    });
  }

  // Best product scaling opportunity
  const best = metrics.bestProducts[0];
  if (best && best.margin >= 15 && recs.length < 5) {
    recs.push({
      title: "Escalá lo que funciona",
      problem: `"${best.name}" lidera con ${best.margin.toFixed(1)}% de margen. Hay espacio para crecer sin erosionar ganancia.`,
      action: "→ Sumá presupuesto en remarketing o bundle con tu segundo producto más rentable.",
      impact: `Potencial de escalar ingresos manteniendo margen sólido.`,
      type: "opportunity",
      category: "Scaling",
      confidence: 72,
      urgency: "medium",
      estimatedImpactUsd: best.revenue * 0.3,
      dataPoints: [
        `Margen: ${best.margin.toFixed(1)}%`,
        `Revenue: $${best.revenue.toFixed(0)}`,
        `Unidades: ${best.unitsSold}`,
      ],
    });
  }

  // MER alert
  if (metrics.mer > 0 && metrics.mer < 3 && recs.length < 5) {
    recs.push({
      title: "MER por debajo del objetivo",
      problem: `Tu MER (Marketing Efficiency Ratio) es ${metrics.mer.toFixed(1)}x. Cada $1 en ads genera $${metrics.mer.toFixed(1)} en ventas brutas.`,
      action: "→ Revisá campañas con ROAS < 2x y redirigí presupuesto a las de mayor rendimiento.",
      impact: "Un MER < 3x suele indicar que el canal de ads no se está pagando solo.",
      type: "warning",
      category: "Ads",
      confidence: 75,
      urgency: "medium",
      estimatedImpactUsd: metrics.wastedSpend * 0.5,
      dataPoints: [
        `MER actual: ${metrics.mer.toFixed(1)}x`,
        `Gasto total en ads: $${metrics.totalAdSpend.toFixed(0)}`,
        `Revenue total: $${metrics.totalRevenue.toFixed(0)}`,
      ],
    });
  }

  // Generic fallback
  while (recs.length < 3) {
    recs.push({
      title: "Revisá métricas clave",
      problem: `Margen ${metrics.avgMargin.toFixed(1)}% y ganancia neta $${metrics.netProfit.toFixed(0)} en 30 días.`,
      action: "→ Conectá todas las integraciones y actualizá costos en Configuración.",
      impact: "Datos completos = recomendaciones más precisas.",
      type: "opportunity",
      category: "Profitability",
      confidence: 60,
      urgency: "low",
    });
  }

  return recs.slice(0, 7);
}
