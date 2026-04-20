import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TN_SESSION_COOKIE, parseTiendanubeSession } from "@/lib/tiendanube-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const appId = process.env.TIENDANUBE_APP_ID?.trim();
  const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET?.trim();
  const configured = Boolean(appId && clientSecret);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message:
        "Faltan TIENDANUBE_APP_ID y/o TIENDANUBE_CLIENT_SECRET en el servidor.",
    });
  }

  const raw = cookies().get(TN_SESSION_COOKIE)?.value;
  const session = parseTiendanubeSession(raw);
  if (!session) {
    return NextResponse.json({ configured: true, connected: false });
  }

  return NextResponse.json({
    configured: true,
    connected: true,
    storeId: session.storeId,
    storeName: session.storeName ?? null,
    storeUrl: session.storeUrl ?? null,
    currency: session.currency ?? null,
    scope: session.scope,
    lastSyncedAt: session.lastSyncedAt ?? null,
  });
}
