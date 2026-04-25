import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SHOPIFY_STATE_COOKIE,
  getAppOrigin,
  getShopifyRedirectUri,
  getShopifyScopes,
  isValidShopDomain,
  sanitizeShopifyOAuthReturnTo,
} from "@/lib/shopify-auth";

export const dynamic = "force-dynamic";

/**
 * Inicia OAuth con Shopify.
 * GET /api/auth/shopify?shop=mi-tienda.myshopify.com
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawShop = url.searchParams.get("shop");
  const shop = rawShop?.trim().toLowerCase() ?? null;
  const returnTo = sanitizeShopifyOAuthReturnTo(url.searchParams.get("return_to"));

  const origin = getAppOrigin();
  const back = (params: Record<string, string>) => {
    const u = new URL(`${origin}/dashboard/configuracion`);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return NextResponse.redirect(u.toString());
  };

  const apiKey = process.env.SHOPIFY_API_KEY?.trim();
  if (!apiKey) {
    return back({ shopify: "not_configured" });
  }

  if (!isValidShopDomain(shop)) {
    return back({ shopify: "invalid_shop" });
  }

  const state = crypto.randomBytes(16).toString("hex");
  cookies().set(
    SHOPIFY_STATE_COOKIE,
    JSON.stringify({ state, shop, returnTo }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
      secure: process.env.NODE_ENV === "production",
    }
  );

  const scopes = getShopifyScopes();
  const redirectUri = getShopifyRedirectUri();

  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", apiKey);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("grant_options[]", "");

  return NextResponse.redirect(authUrl.toString());
}
