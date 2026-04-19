import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  getAppOrigin,
  getMercadoLibreRedirectUri,
  ML_STATE_COOKIE,
  ML_TOKEN_COOKIE,
} from "@/lib/mercadolibre-auth";

function redirectToConfig(query: Record<string, string>) {
  const u = new URL(`${getAppOrigin()}/dashboard/configuracion`);
  Object.entries(query).forEach(([k, v]) => u.searchParams.set(k, v));
  return NextResponse.redirect(u.toString());
}

/**
 * Callback OAuth de Mercado Libre.
 * GET /api/auth/mercadolibre/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");

  if (err) {
    return redirectToConfig({
      ml: "error",
      reason: errDesc || err,
    });
  }

  const cookieStore = cookies();
  const savedState = cookieStore.get(ML_STATE_COOKIE)?.value;

  if (!state || !savedState || state !== savedState) {
    return redirectToConfig({ ml: "error", reason: "state_invalido" });
  }

  if (!code) {
    return redirectToConfig({ ml: "error", reason: "sin_codigo" });
  }

  const appId = process.env.MERCADOLIBRE_APP_ID?.trim();
  const secret = process.env.MERCADOLIBRE_CLIENT_SECRET?.trim();
  if (!appId || !secret) {
    return redirectToConfig({ ml: "error", reason: "faltan_credenciales_servidor" });
  }

  const redirectUri = getMercadoLibreRedirectUri();

  const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: appId,
      client_secret: secret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    user_id?: number;
    expires_in?: number;
    error?: string;
    message?: string;
  };

  if (!tokenRes.ok || data.error || !data.access_token) {
    return redirectToConfig({
      ml: "error",
      reason: data.message || data.error || "token_fallido",
    });
  }

  const payload = JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    user_id: data.user_id ?? null,
    expires_in: data.expires_in ?? null,
    obtained_at: Date.now(),
  });

  cookieStore.delete(ML_STATE_COOKIE);
  cookieStore.set(ML_TOKEN_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return redirectToConfig({ ml: "connected" });
}
