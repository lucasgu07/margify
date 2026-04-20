import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { META_COOKIE, parseMetaSession } from "@/lib/meta-auth";

/**
 * Estado de la sesión de Meta (cookie httpOnly).
 * GET /api/meta-ads/status
 */
export async function GET() {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const configured = Boolean(appId && appSecret);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "Faltan META_APP_ID y/o META_APP_SECRET en el servidor.",
    });
  }

  const raw = cookies().get(META_COOKIE)?.value;
  const session = parseMetaSession(raw);
  if (!session) {
    return NextResponse.json({ configured: true, connected: false });
  }

  return NextResponse.json({
    configured: true,
    connected: true,
    userId: session.user_id ?? null,
    userName: session.user_name ?? null,
    adAccountId: session.ad_account_id ?? null,
    adAccounts: session.ad_accounts ?? [],
    lastSyncedAt: session.last_synced_at ?? null,
  });
}
