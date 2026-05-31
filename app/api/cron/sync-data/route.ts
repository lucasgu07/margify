import { NextResponse } from "next/server";
import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import { listUserIdsWithIntegrations } from "@/lib/server/user-integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Cron: pre-carga datos de integraciones (cada 6 h).
 * Mantiene tokens activos y calienta métricas para alertas.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userIds = await listUserIdsWithIntegrations();
  let ok = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await loadLiveDashboardData(userId);
      ok += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, users: userIds.length, synced: ok, failed });
}
