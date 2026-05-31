import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseTikTokSession, TIKTOK_COOKIE } from "@/lib/tiktok-auth";
import { getAuthUser } from "@/lib/server/auth-user";
import { getUserIntegration } from "@/lib/server/user-integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const appId = process.env.TIKTOK_CLIENT_ID?.trim() || process.env.TIKTOK_APP_ID?.trim();
  const secret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  if (!appId || !secret) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "Faltan TIKTOK_CLIENT_ID y TIKTOK_CLIENT_SECRET en el servidor.",
    });
  }

  const user = await getAuthUser();
  let session = parseTikTokSession(cookies().get(TIKTOK_COOKIE)?.value);
  if (!session && user) {
    const fromDb = await getUserIntegration(user.id, "tiktok");
    if (fromDb?.access_token && fromDb?.advertiser_id) {
      session = {
        access_token: String(fromDb.access_token),
        advertiser_id: String(fromDb.advertiser_id),
        last_synced_at: fromDb.last_synced_at as number | null | undefined,
      };
    }
  }

  if (!session) {
    return NextResponse.json({ configured: true, connected: false });
  }

  return NextResponse.json({
    configured: true,
    connected: true,
    advertiserId: session.advertiser_id,
    lastSyncedAt: session.last_synced_at ?? null,
  });
}
