import { NextResponse } from "next/server";
import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import { getAuthUser } from "@/lib/server/auth-user";
import { toCostsConfig } from "@/lib/server/user-costs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Datos agregados del dashboard para usuario autenticado (pedidos + campañas + costos).
 * GET /api/dashboard/bootstrap
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const live = await loadLiveDashboardData(user.id);
    return NextResponse.json({
      ok: true,
      plan: user.plan,
      costsConfig: toCostsConfig(user.id, live.costsConfig),
      orders: live.orders,
      campaigns: live.campaigns,
      connectedStores: live.connectedStores,
      integrations: live.integrations,
      syncedAt: Date.now(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bootstrap_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
