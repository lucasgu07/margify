import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import { getDashboardMetrics } from "@/lib/mock-data";
import { canUseWhatsAppAlerts } from "@/lib/plan-features";
import {
  insertAlertHistory,
  listAlertConfigs,
  sendAlertEmail,
  sendAlertWhatsApp,
} from "@/lib/server/user-alerts";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type { Plan } from "@/types";

async function getUserWhatsApp(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = data.user?.user_metadata as { whatsapp_number?: string } | undefined;
  const n = meta?.whatsapp_number?.trim();
  return n || null;
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

  for (const rule of active) {
    let triggered = false;
    let message = "";

    if (rule.alert_type === "roas_drop" && metrics.trueRoas < rule.threshold) {
      triggered = true;
      message = `ROAS real ${metrics.trueRoas.toFixed(2)}x está por debajo de ${rule.threshold}x.`;
    } else if (rule.alert_type === "margin_drop" && metrics.marginPercent < rule.threshold) {
      triggered = true;
      message = `Margen neto ${metrics.marginPercent.toFixed(1)}% está por debajo de ${rule.threshold}%.`;
    }

    if (!triggered) continue;
    fired += 1;

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

  return fired;
}
