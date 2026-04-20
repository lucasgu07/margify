import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GOOGLE_ADS_COOKIE,
  GOOGLE_ADS_STATE_COOKIE,
  GOOGLE_OAUTH_TOKEN_URL,
  getAppOrigin,
  getGoogleAdsRedirectUri,
  normalizeCustomerId,
} from "@/lib/google-ads";
import { GoogleAdsApi } from "google-ads-api";

function redirectToConfig(query: Record<string, string>) {
  const u = new URL(`${getAppOrigin()}/dashboard/configuracion`);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
  return NextResponse.redirect(u.toString());
}

/**
 * Callback de Google: intercambia `code` por tokens. Guarda `refresh_token`, `access_token`
 * y el primer `customer_id` accesible en una cookie httpOnly (consistente con el patrón de Mercado Libre).
 *
 * GET /api/auth/google/callback?code=...&state=...
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return redirectToConfig({ ga: "error", reason: encodeURIComponent(error) });
  }

  const cookieStore = cookies();
  const savedState = cookieStore.get(GOOGLE_ADS_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_ADS_STATE_COOKIE);

  if (!state || !savedState || state !== savedState) {
    return redirectToConfig({ ga: "error", reason: "state_invalido" });
  }
  if (!code) {
    return redirectToConfig({ ga: "error", reason: "sin_codigo" });
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  if (!clientId || !clientSecret) {
    return redirectToConfig({ ga: "error", reason: "faltan_credenciales_servidor" });
  }

  const redirectUri = getGoogleAdsRedirectUri();
  let access_token = "";
  let refresh_token: string | null = null;
  let expires_in: number | null = null;

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });
    const tokenRes = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokenJson.access_token) {
      const reason = encodeURIComponent(
        tokenJson.error_description || tokenJson.error || "intercambio_fallo"
      );
      return redirectToConfig({ ga: "error", reason });
    }
    access_token = tokenJson.access_token;
    refresh_token = tokenJson.refresh_token ?? null;
    expires_in = tokenJson.expires_in ?? null;
  } catch {
    return redirectToConfig({ ga: "error", reason: "red_token" });
  }

  /**
   * Si conseguimos refresh_token y developer_token, intentamos resolver el primer
   * customer_id accesible. Si falla (p. ej. developer_token aún no aprobado),
   * seguimos guardando el refresh_token para poder reintentar desde la UI.
   */
  let customer_id: string | null = null;
  if (refresh_token && developerToken && clientId && clientSecret) {
    try {
      const client = new GoogleAdsApi({
        client_id: clientId,
        client_secret: clientSecret,
        developer_token: developerToken,
      });
      const { resource_names } = await client.listAccessibleCustomers(refresh_token);
      const first = resource_names?.[0];
      if (first) {
        customer_id = normalizeCustomerId(first.split("/")[1] ?? null);
      }
    } catch {
      customer_id = null;
    }
  }

  const session = {
    access_token,
    refresh_token,
    expires_in,
    obtained_at: Date.now(),
    customer_id,
    login_customer_id: normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
    last_synced_at: null,
  };

  cookies().set(GOOGLE_ADS_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  return redirectToConfig({ ga: "connected" });
}
