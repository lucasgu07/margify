import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  TIKTOK_COOKIE,
  TIKTOK_STATE_COOKIE,
  getTikTokRedirectUri,
  type TikTokSession,
} from "@/lib/tiktok-auth";
import { getAppOrigin } from "@/lib/meta-auth";
import { persistOAuthSession } from "@/lib/server/persist-oauth";

function redirectToConfig(query: Record<string, string>) {
  const u = new URL(`${getAppOrigin()}/dashboard/configuracion`);
  Object.entries(query).forEach(([k, v]) => u.searchParams.set(k, v));
  return NextResponse.redirect(u.toString());
}

/** GET /api/auth/tiktok/callback */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("auth_code") || url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    return redirectToConfig({ tiktok: "error", reason: err });
  }

  const cookieStore = cookies();
  const savedState = cookieStore.get(TIKTOK_STATE_COOKIE)?.value;
  cookieStore.delete(TIKTOK_STATE_COOKIE);

  if (!state || !savedState || state !== savedState) {
    return redirectToConfig({ tiktok: "error", reason: "state_invalido" });
  }
  if (!code) {
    return redirectToConfig({ tiktok: "error", reason: "sin_codigo" });
  }

  const appId = process.env.TIKTOK_CLIENT_ID?.trim() || process.env.TIKTOK_APP_ID?.trim();
  const secret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  if (!appId || !secret) {
    return redirectToConfig({ tiktok: "error", reason: "faltan_credenciales" });
  }

  const tokenRes = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: appId,
        secret,
        auth_code: code,
      }),
    }
  );

  const tokenJson = (await tokenRes.json()) as {
    code?: number;
    message?: string;
    data?: {
      access_token?: string;
      advertiser_ids?: string[];
    };
  };

  if (!tokenRes.ok || tokenJson.code !== 0 || !tokenJson.data?.access_token) {
    return redirectToConfig({
      tiktok: "error",
      reason: tokenJson.message ?? "token_fallido",
    });
  }

  const advertiserId = tokenJson.data.advertiser_ids?.[0];
  if (!advertiserId) {
    return redirectToConfig({ tiktok: "error", reason: "sin_advertiser_id" });
  }

  const session: TikTokSession = {
    access_token: tokenJson.data.access_token,
    advertiser_id: advertiserId,
    advertiser_ids: tokenJson.data.advertiser_ids,
    obtained_at: Date.now(),
    last_synced_at: null,
  };

  cookieStore.set(TIKTOK_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  await persistOAuthSession("tiktok", session as unknown as Record<string, unknown>);

  return redirectToConfig({ tiktok: "connected" });
}
