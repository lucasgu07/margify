import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SHOPIFY_SESSION_COOKIE,
  parseShopifySession,
} from "@/lib/shopify-auth";

export const dynamic = "force-dynamic";

/**
 * Estado de la sesión de Shopify (cookie httpOnly).
 * GET /api/shopify/status
 */
export async function GET() {
  const apiKey = process.env.SHOPIFY_API_KEY?.trim();
  const apiSecret = process.env.SHOPIFY_API_SECRET?.trim();
  const configured = Boolean(apiKey && apiSecret);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "Faltan SHOPIFY_API_KEY y/o SHOPIFY_API_SECRET en el servidor.",
    });
  }

  const raw = cookies().get(SHOPIFY_SESSION_COOKIE)?.value;
  const session = parseShopifySession(raw);
  if (!session) {
    return NextResponse.json({ configured: true, connected: false });
  }

  return NextResponse.json({
    configured: true,
    connected: true,
    shop: session.shop,
    scope: session.scope,
    installedAt: session.installedAt,
    lastSyncedAt: session.lastSyncedAt ?? null,
  });
}
