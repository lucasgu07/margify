import { NextResponse } from "next/server";
import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import { getDashboardMetrics } from "@/lib/mock-data";
import { findUserIdByApiKey } from "@/lib/server/api-keys";
import { planFromBillingMeta, type UserBillingMeta } from "@/lib/dodo-billing";
import { canUseApiAccess, filterCampaignsByPlanHistory, filterOrdersByPlanHistory } from "@/lib/plan-features";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const header = request.headers.get("x-margify-key");
  return header?.trim() || null;
}

async function resolveUserFromKey(key: string) {
  const userId = await findUserIdByApiKey(key);
  if (!userId) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin.auth.admin.getUserById(userId);
  if (!data.user) return null;
  const meta = (data.user.user_metadata ?? {}) as UserBillingMeta;
  const plan = planFromBillingMeta(meta);
  if (!canUseApiAccess(plan)) return null;
  return { id: userId, email: data.user.email ?? "", plan };
}

/**
 * GET /api/v1/metrics — métricas agregadas (plan Pro+).
 * Header: Authorization: Bearer mfy_...
 */
export async function GET(request: Request) {
  const key = extractApiKey(request);
  if (!key) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 401 });
  }

  const user = await resolveUserFromKey(key);
  if (!user) {
    return NextResponse.json({ error: "invalid_or_unauthorized_key" }, { status: 401 });
  }

  const live = await loadLiveDashboardData(user.id);
  const orders = filterOrdersByPlanHistory(live.orders, user.plan);
  const campaigns = filterCampaignsByPlanHistory(live.campaigns, user.plan);
  const metrics = getDashboardMetrics(orders, null, campaigns);

  return NextResponse.json({
    ok: true,
    plan: user.plan,
    synced_at: new Date().toISOString(),
    metrics: {
      total_sales: metrics.totalSales,
      net_profit: metrics.netProfit,
      margin_percent: metrics.marginPercent,
      true_roas: metrics.trueRoas,
      mer: metrics.mer,
      order_count: metrics.orderCount,
      aov: metrics.aov,
    },
    integrations: live.integrations,
  });
}
