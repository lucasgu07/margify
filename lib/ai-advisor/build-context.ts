import type { AdvisorPage } from "@/lib/ai-advisor/types";
import { pageLabel } from "@/lib/ai-advisor/page-defaults";
import {
  buildCashflowEntries,
  buildProductProfits,
  cashflowSummary,
  channelProfitRows,
  getDashboardMetrics,
} from "@/lib/mock-data";
import type { Campaign, Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

function topCampaigns(campaigns: Campaign[], n = 5): string {
  if (!campaigns.length) return "Sin campañas en el período.";
  return [...campaigns]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, n)
    .map(
      (c) =>
        `- ${c.campaign_name} (${c.platform}, ${c.status}): gasto ${formatCurrency(c.spend)}, ROAS real ${c.roas_real.toFixed(2)}x, ingresos atrib. ${formatCurrency(c.attributed_revenue)}`
    )
    .join("\n");
}

function topProducts(orders: Order[], n = 5): string {
  const products = buildProductProfits(orders);
  if (!products.length) return "Sin ventas de productos en el período.";
  return [...products]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n)
    .map(
      (p) =>
        `- ${p.name}: ${p.units_sold} u., ingresos ${formatCurrency(p.revenue)}, margen ${p.margin_percent.toFixed(1)}%`
    )
    .join("\n");
}

export function buildAdvisorContextBlock(
  page: AdvisorPage,
  orders: Order[],
  campaigns: Campaign[],
  extras?: { alertHistory?: { message: string; alert_type: string; read: boolean }[] }
): string {
  const m = getDashboardMetrics(orders, null, campaigns);
  const channels = channelProfitRows(orders);
  const cashflow = cashflowSummary(buildCashflowEntries(orders));

  const lines = [
    `Pantalla: ${pageLabel(page)}`,
    `Órdenes analizadas: ${orders.length}`,
    `Ventas totales: ${formatCurrency(m.totalSales)} · Ganancia neta: ${formatCurrency(m.netProfit)} · Margen: ${m.marginPercent.toFixed(1)}%`,
    `ROAS real: ${m.trueRoas.toFixed(2)}x · MER: ${m.mer.toFixed(2)}x · Ticket promedio: ${formatCurrency(m.aov)}`,
    `Gasto ads atribuido: ${formatCurrency(m.adSpendAttributed)} · Campañas: ${campaigns.length} (${campaigns.filter((c) => c.status === "active").length} activas)`,
    `Cashflow próxima semana: ${formatCurrency(cashflow.nextWeek)} · Este mes: ${formatCurrency(cashflow.month)}`,
  ];

  if (channels.length) {
    const ch = [...channels].sort((a, b) => b.margin_percent - a.margin_percent)[0];
    lines.push(`Canal más rentable: ${ch.channel} (${ch.margin_percent.toFixed(1)}% margen)`);
  }

  if (page === "campanas" || page === "dashboard") {
    lines.push("Top campañas por gasto:", topCampaigns(campaigns));
  }

  if (page === "productos" || page === "rentabilidad" || page === "dashboard") {
    lines.push("Top productos:", topProducts(orders));
  }

  if (page === "cashflow") {
    lines.push(
      `Cashflow esta semana: ${formatCurrency(cashflow.thisWeek)} · Proyección próxima semana: ${formatCurrency(cashflow.nextWeek)}`
    );
  }

  if (page === "alertas" && extras?.alertHistory?.length) {
    const unread = extras.alertHistory.filter((h) => !h.read).length;
    lines.push(`Alertas recientes (${unread} sin leer):`);
    for (const h of extras.alertHistory.slice(0, 5)) {
      lines.push(`- [${h.alert_type}] ${h.message.slice(0, 160)}`);
    }
  }

  return lines.join("\n");
}
