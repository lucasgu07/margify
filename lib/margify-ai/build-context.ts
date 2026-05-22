import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import {
  applyStarterMonthlyOrderCap,
  getDashboardMetrics,
  mockAlertsHistory,
  mockCampaigns,
  mockOrders,
  mockUser,
} from "@/lib/mock-data";
import type { Plan } from "@/types";
import { formatCurrency } from "@/lib/utils";

function contextLines(
  label: string,
  ordersCount: number,
  m: ReturnType<typeof getDashboardMetrics>,
  campaignsCount: number,
  activeCampaigns: number,
  totalSpend: number,
  unreadAlerts: number
): string {
  return [
    label,
    `- Órdenes en el rango analizado: ${ordersCount}`,
    `- Margen neto aprox.: ${m.marginPercent.toFixed(1)}% · ROAS real agregado aprox.: ${m.trueRoas.toFixed(2)}x · MER aprox.: ${m.mer.toFixed(2)}x`,
    `- Campañas en catálogo: ${campaignsCount} (${activeCampaigns} activas) · Gasto publicitario total: ${formatCurrency(totalSpend)}`,
    `- Alertas sin leer: ${unreadAlerts}`,
    "Usá estos datos solo como orientación; si falta detalle, pedí números o capturas al usuario.",
  ].join("\n");
}

/** Contexto demo (sin sesión). */
export function buildMargifyAIContextBlock(): string {
  const ordersForContext = applyStarterMonthlyOrderCap(mockOrders, mockUser.plan);
  const m = getDashboardMetrics(ordersForContext, null, mockCampaigns);
  const activeCampaigns = mockCampaigns.filter((c) => c.status === "active").length;
  const totalSpend = mockCampaigns.reduce((a, c) => a + c.spend, 0);
  const unreadAlerts = mockAlertsHistory.filter((a) => !a.read).length;
  return contextLines(
    "[Contexto Margify (modo demo — datos de ejemplo)]",
    ordersForContext.length,
    m,
    mockCampaigns.length,
    activeCampaigns,
    totalSpend,
    unreadAlerts
  );
}

/** Contexto con datos reales del usuario (integraciones conectadas). */
export async function buildMargifyAIContextForUser(
  userId: string,
  plan: Plan
): Promise<string> {
  try {
    const live = await loadLiveDashboardData(userId);
    const ordersForContext = applyStarterMonthlyOrderCap(live.orders, plan);
    const m = getDashboardMetrics(ordersForContext, null, live.campaigns);
    const activeCampaigns = live.campaigns.filter((c) => c.status === "active").length;
    const totalSpend = live.campaigns.reduce((a, c) => a + c.spend, 0);
    const integrations = [
      live.integrations.shopify ? "Shopify" : null,
      live.integrations.tiendanube ? "TiendaNube" : null,
      live.integrations.meta ? "Meta Ads" : null,
      live.integrations.google ? "Google Ads" : null,
    ]
      .filter(Boolean)
      .join(", ");

    const header = integrations
      ? `[Contexto Margify (cuenta real — integraciones: ${integrations})]`
      : "[Contexto Margify (cuenta real — sin integraciones conectadas aún)]";

    return contextLines(
      header,
      ordersForContext.length,
      m,
      live.campaigns.length,
      activeCampaigns,
      totalSpend,
      0
    );
  } catch {
    return buildMargifyAIContextBlock();
  }
}
