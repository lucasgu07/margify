import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SHOPIFY_SESSION_COOKIE,
  SHOPIFY_STATE_COOKIE,
  getAppOrigin,
  isValidShopDomain,
  parseShopifyState,
  sanitizeShopifyOAuthReturnTo,
  serializeShopifySession,
  verifyShopifyHmac,
  type ShopifySession,
} from "@/lib/shopify-auth";

export const dynamic = "force-dynamic";

type TokenResponse = {
  access_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

/**
 * Callback OAuth de Shopify.
 *   1. Valida shop.
 *   2. Valida state contra cookie.
 *   3. Valida HMAC (firma de Shopify) con SHOPIFY_API_SECRET.
 *   4. Intercambia `code` por access_token llamando a {shop}/admin/oauth/access_token.
 *   5. Guarda la sesión en cookie httpOnly `shopify_oauth_session`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getAppOrigin();

  const cookieStore = cookies();
  const savedRaw = cookieStore.get(SHOPIFY_STATE_COOKIE)?.value;
  const savedPreview = parseShopifyState(savedRaw);
  const returnPath = savedPreview
    ? sanitizeShopifyOAuthReturnTo(savedPreview.returnTo)
    : "/dashboard/configuracion";

  const back = (params: Record<string, string>) => {
    const u = new URL(`${origin}${returnPath}`);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return NextResponse.redirect(u.toString());
  };

  const shop = url.searchParams.get("shop")?.toLowerCase() ?? null;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!isValidShopDomain(shop)) {
    cookieStore.delete(SHOPIFY_STATE_COOKIE);
    return back({ shopify: "invalid_shop" });
  }

  cookieStore.delete(SHOPIFY_STATE_COOKIE);
  const saved = parseShopifyState(savedRaw);

  if (!state || !saved || saved.state !== state || saved.shop !== shop) {
    return back({ shopify: "state_mismatch" });
  }

  const apiKey = process.env.SHOPIFY_API_KEY?.trim();
  const apiSecret = process.env.SHOPIFY_API_SECRET?.trim();
  if (!apiKey || !apiSecret) {
    return back({ shopify: "not_configured" });
  }

  if (!verifyShopifyHmac(url.searchParams, apiSecret)) {
    return back({ shopify: "hmac_failed" });
  }

  if (!code) {
    return back({ shopify: "error", reason: "missing_code" });
  }

  let tokenJson: TokenResponse;
  try {
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });
    tokenJson = (await res.json()) as TokenResponse;
    if (!res.ok || !tokenJson.access_token) {
      const reason = encodeURIComponent(
        tokenJson.error_description || tokenJson.error || `http_${res.status}`
      );
      return back({ shopify: "error", reason });
    }
  } catch {
    return back({ shopify: "error", reason: "network_exchange" });
  }

  const session: ShopifySession = {
    shop,
    accessToken: tokenJson.access_token!,
    scope: tokenJson.scope ?? "",
    installedAt: Date.now(),
    lastSyncedAt: null,
  };

  cookies().set(SHOPIFY_SESSION_COOKIE, serializeShopifySession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    secure: process.env.NODE_ENV === "production",
  });

  return back({ shopify: "connected" });
}
