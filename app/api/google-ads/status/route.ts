import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_ADS_COOKIE, parseGoogleAdsSession } from "@/lib/google-ads";

/**
 * Estado de la conexión Google Ads (cookie httpOnly).
 * GET /api/google-ads/status
 */
export async function GET() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  const configured = Boolean(clientId && devToken);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "Faltan GOOGLE_ADS_CLIENT_ID y/o GOOGLE_ADS_DEVELOPER_TOKEN en el servidor.",
    });
  }

  const raw = cookies().get(GOOGLE_ADS_COOKIE)?.value;
  const session = parseGoogleAdsSession(raw);
  if (!session) {
    return NextResponse.json({ configured: true, connected: false });
  }

  return NextResponse.json({
    configured: true,
    connected: true,
    customerId: session.customer_id ?? null,
    lastSyncedAt: session.last_synced_at ?? null,
  });
}
