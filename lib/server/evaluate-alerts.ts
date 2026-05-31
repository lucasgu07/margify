import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import {
  buildCashflowTableRows,
  buildProductProfits,
  cashflowSummary,
  getDashboardMetrics,
} from "@/lib/mock-data";
import { canUseWhatsAppAlerts } from "@/lib/plan-features";
import { wasAlertRecentlySent } from "@/lib/server/alert-dedup";
import {
  insertAlertHistory,
  listAlertConfigs,
  sendAlertEmail,
  sendAlertWhatsApp,
} from "@/lib/server/user-alerts";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type { AlertType, Plan } from "@/types";

async function getUserWhatsApp(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = data.user?.user_metadata as { whatsapp_number?: string } | undefined;
  return meta?.whatsapp_number?.trim() || null;
}

async function dispatchAlert(
  userId: string,
  email: string,
  plan: Plan,
  whatsapp: string | null,
  rule: { title: string; channel: string; alert_type: AlertType },
  message: string
): Promise<void> {
  await insertAlertHistory(userId, rule.alert_type, message, rule.channel);

  if (rule.channel === "email" || rule.channel === "both") {
    await sendAlertEmail(email, `[Margify] ${rule.title}`, message);
  }
  if (
    whatsapp &&
    canUseWhatsAppAlerts(plan) &&
    (rule.channel === "whatsapp" || rule.channel === "both")
  ) {
    await sendAlertWhatsApp(whatsapp, { title: rule.title, message });
  }
}

export async function evaluateAlertsForUser(
  userId: string,
  email: string,
  plan: Plan
): Promise<number> {
  const configs = await listAlertConfigs(userId);
  const active = configs.filter((c) => c.active);
  if (!active.length) return 0;

  const live = await loadLiveDashboardData(userId);
  const metrics = getDashboardMetrics(live.orders, null, live.campaigns);
  const whatsapp = await getUserWhatsApp(userId);
  let fired = 0;

  const cashflowRows = buildCashflowTableRows(live.orders);
  const cashflowEntries = cashflowRows.map((r) => ({
    id: r.id,
    sale_date: r.sale_date,
    amount: r.total_order,
    payment_method: r.payment_method,
    estimated_payout_date: r.payout_date,
    status: r.status,
  }));
  const cf = cashflowSummary(cashflowEntries);
  const products = buildProductProfits(live.orders);
  const unprofitable = products.filter((p) => p.units_sold > 0 && p.margin_percent <= 0);

  for (const rule of active) {
    if (await wasAlertRecentlySent(userId, rule.alert_type)) continue;

    let triggered = false;
    let message = "";

    switch (rule.alert_type) {
      case "roas_drop":
        if (metrics.trueRoas < rule.threshold) {
          triggered = true;
          message = `ROAS real ${metrics.trueRoas.toFixed(2)}x está por debajo de ${rule.threshold}x.`;
        }
        break;
      case "margin_drop":
        if (metrics.marginPercent < rule.threshold) {
          triggered = true;
          message = `Margen neto ${metrics.marginPercent.toFixed(1)}% está por debajo de ${rule.threshold}%.`;
        }
        break;
      case "cashflow_negative":
        if (cf.nextWeek < 0) {
          triggered = true;
          message = `Cashflow proyectado negativo la próxima semana: ${cf.nextWeek.toFixed(0)} USD.`;
        }
        break;
      case "campaign_no_conversions": {
        const days = Math.max(1, rule.threshold);
        const bad = live.campaigns.filter(
          (c) => c.spend > 50 * days && (c.conversions ?? 0) === 0 && c.status === "active"
        );
        if (bad.length > 0) {
          triggered = true;
          message = `${bad.length} campaña(s) activa(s) con gasto y sin conversiones: ${bad.slice(0, 3).map((c) => c.campaign_name).join(", ")}.`;
        }
        break;
      }
      case "product_no_profit":
        if (unprofitable.length > 0) {
          triggered = true;
          message = `${unprofitable.length} producto(s) vendidos sin ganancia: ${unprofitable.slice(0, 3).map((p) => p.name).join(", ")}.`;
        }
        break;
      case "weekly_summary": {
        const isMonday = new Date().getUTCDay() === 1;
        if (isMonday && !(await wasAlertRecentlySent(userId, "weekly_summary", 24 * 6))) {
          triggered = true;
          message = `Resumen semanal: ventas ${metrics.totalSales.toFixed(0)} USD, margen ${metrics.marginPercent.toFixed(1)}%, ROAS ${metrics.trueRoas.toFixed(2)}x, ${live.orders.length} órdenes.`;
        }
        break;
      }
      default:
        break;
    }

    if (!triggered) continue;
    fired += 1;
    await dispatchAlert(userId, email, plan, whatsapp, rule, message);
  }

  return fired;
}
