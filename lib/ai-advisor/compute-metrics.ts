import { isoDateLocal } from "@/lib/dashboard-filters";
import {
  buildCashflowEntries,
  buildProductProfits,
  cashflowSummary,
  getDashboardMetrics,
} from "@/lib/mock-data";
import type { Campaign, Order } from "@/types";
import type { CostsConfigInput } from "@/lib/server/user-costs";

export type CampaignMetricRow = {
  name: string;
  spend: number;
  realRoas: number;
  conversions: number;
  daysWithoutConversion: number;
  lowRoas: boolean;
  staleSpendNoConv: boolean;
};

export type ProductMetricRow = {
  name: string;
  margin: number;
  unitsSold: number;
  revenue: number;
  minPriceHint?: number;
};

export type AdvisorMetricsPayload = {
  totalRevenue: number;
  netProfit: number;
  avgMargin: number;
  campaigns: CampaignMetricRow[];
  bestProducts: ProductMetricRow[];
  worstProducts: ProductMetricRow[];
  projectedCashflow: number;
  orderCount: number;
  hasStoreConnected: boolean;
};

function cutoff30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
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
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (86400000)));
}

export function computeAdvisorMetrics(
  orders: Order[],
  campaigns: Campaign[],
  costs: CostsConfigInput,
  integrations: Parameters<typeof hasConnectedStore>[0]
): AdvisorMetricsPayload {
  const periodOrders = filterOrdersLast30Days(orders);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const m = getDashboardMetrics(periodOrders, null, campaigns);

  const campaignRows: CampaignMetricRow[] = activeCampaigns.map((c) => {
    const realRoas = c.spend > 0 ? c.attributed_revenue / c.spend : 0;
    const conv = c.conversions ?? 0;
    const daysWithoutConversion =
      conv > 0 ? 0 : Math.max(3, daysSince(c.date || cutoff30Days()));
    return {
      name: c.campaign_name,
      spend: c.spend,
      realRoas,
      conversions: conv,
      daysWithoutConversion,
      lowRoas: realRoas > 0 && realRoas < 1.5,
      staleSpendNoConv: c.spend > 150 && conv === 0 && daysWithoutConversion >= 3,
    };
  });

  const products = buildProductProfits(periodOrders);
  const sorted = [...products].sort((a, b) => b.margin_percent - a.margin_percent);

  const mapProduct = (p: (typeof products)[0]): ProductMetricRow => {
    let minPriceHint: number | undefined;
    if (p.margin_percent < 0 && p.units_sold > 0) {
      const avgRev = p.revenue / p.units_sold;
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

  const cashflow = cashflowSummary(buildCashflowEntries(periodOrders));

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
  };
}

/** Reglas locales si Claude falla */
export function buildFallbackRecommendations(
  metrics: AdvisorMetricsPayload
): import("@/lib/ai-advisor/recommendation-types").AdvisorRecommendation[] {
  const recs: import("@/lib/ai-advisor/recommendation-types").AdvisorRecommendation[] = [];

  const worstCamp = metrics.campaigns
    .filter((c) => c.lowRoas && c.spend > 200)
    .sort((a, b) => b.spend - a.spend)[0];
  if (worstCamp) {
    const waste = worstCamp.spend * (1 - worstCamp.realRoas / 1.5);
    recs.push({
      title: "Pausá campaña sangrante",
      problem: `"${worstCamp.name}" tiene ROAS real ${worstCamp.realRoas.toFixed(2)}x con $${worstCamp.spend.toFixed(0)} de gasto.`,
      action: `→ Pausala hoy en Ads Manager y redirigí ese presupuesto a una campaña con ROAS > 2x.`,
      impact: `Podés dejar de quemar ~$${Math.max(50, waste).toFixed(0)} por semana.`,
      type: "danger",
    });
  }

  const stale = metrics.campaigns.find((c) => c.staleSpendNoConv);
  if (stale && recs.length < 3) {
    recs.push({
      title: "Campaña sin conversiones",
      problem: `"${stale.name}" lleva ${stale.daysWithoutConversion}+ días gastando sin conversiones verificadas.`,
      action: "→ Revisá pixel, landing y creativos; si no mejoran en 48 h, bajá presupuesto 50%.",
      impact: `Cada día activa puede costarte $${(stale.spend / Math.max(stale.daysWithoutConversion, 3)).toFixed(0)} sin retorno.`,
      type: "warning",
    });
  }

  const badProduct = metrics.worstProducts.find((p) => p.margin < 5);
  if (badProduct && recs.length < 3) {
    recs.push({
      title: "Producto con margen bajo",
      problem: `"${badProduct.name}" margen ${badProduct.margin.toFixed(1)}% en ${badProduct.unitsSold} ventas.`,
      action: badProduct.minPriceHint
        ? `→ Subí precio mínimo a ~$${badProduct.minPriceHint.toFixed(0)} o bajá costo de envío/comisión.`
        : "→ Revisá costo de producto y envío en Configuración.",
      impact: "Cada venta debilita tu ganancia neta del mes.",
      type: "warning",
    });
  }

  const best = metrics.bestProducts[0];
  if (best && best.margin >= 15 && recs.length < 3) {
    recs.push({
      title: "Escalá lo que funciona",
      problem: `"${best.name}" lidera con ${best.margin.toFixed(1)}% de margen.`,
      action: "→ Sumá presupuesto en remarketing o bundle con tu segundo producto más rentable.",
      impact: `Potencial de crecer ventas sin erosionar margen.`,
      type: "opportunity",
    });
  }

  while (recs.length < 3) {
    recs.push({
      title: "Revisá métricas clave",
      problem: `Margen ${metrics.avgMargin.toFixed(1)}% y ganancia neta $${metrics.netProfit.toFixed(0)} en 30 días.`,
      action: "→ Conectá todas las integraciones y actualizá costos en Configuración.",
      impact: "Datos completos = recomendaciones más precisas.",
      type: "opportunity",
    });
  }

  return recs.slice(0, 3);
}
