import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_ADS_COOKIE, parseGoogleAdsSession } from "@/lib/google-ads";

/**
 * Lectura rápida: devuelve el estado de la sesión. La fuente real de verdad
 * es POST /api/google-ads/sync, que trae campañas on-demand.
 */
export async function GET() {
  const raw = cookies().get(GOOGLE_ADS_COOKIE)?.value;
  const session = parseGoogleAdsSession(raw);
  return NextResponse.json({
    connected: Boolean(session?.refresh_token),
    customerId: session?.customer_id ?? null,
    lastSyncedAt: session?.last_synced_at ?? null,
  });
}
