import {
  getDashboardMetrics,
  mockAlertsHistory,
  mockCampaigns,
  mockOrders,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

/**
 * Resumen de contexto para enriquecer respuestas (demo con datos mock).
 * En producción: reemplazar por métricas y campañas del usuario autenticado.
 */
export function buildMargifyAIContextBlock(): string {
  const m = getDashboardMetrics(mockOrders, null);
  const activeCampaigns = mockCampaigns.filter((c) => c.status === "active").length;
  const totalSpend = mockCampaigns.reduce((a, c) => a + c.spend, 0);
  const unreadAlerts = mockAlertsHistory.filter((a) => !a.read).length;

  return [
    "[Contexto Margify (resumen demo; en producción se alimentará con datos reales de la cuenta)]",
    `- Órdenes en el rango analizado: ${mockOrders.length}`,
    `- Margen neto aprox.: ${m.marginPercent.toFixed(1)}% · ROAS real agregado aprox.: ${m.trueRoas.toFixed(2)}x · MER aprox.: ${m.mer.toFixed(2)}x`,
    `- Campañas en catálogo: ${mockCampaigns.length} (${activeCampaigns} activas) · Gasto publicitario mock total: ${formatCurrency(totalSpend)}`,
    `- Alertas sin leer (mock): ${unreadAlerts}`,
    "Usá estos datos solo como orientación; si falta detalle, pedí números o capturas al usuario.",
  ].join("\n");
}
