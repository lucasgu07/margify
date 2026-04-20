import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  TN_SESSION_COOKIE,
  TN_STATE_COOKIE,
  getAppOrigin,
  normalizeTnText,
  serializeTiendanubeSession,
  tiendanubeFetch,
  verifyTiendanubeHmac,
  type TiendanubeSession,
} from "@/lib/tiendanube-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  user_id?: string | number;
  error?: string;
  error_description?: string;
};

type StoreResponse = {
  id?: number;
  name?: Record<string, string> | string;
  country?: string;
  main_currency?: string;
  domains?: string[];
  original_domain?: string;
};

function storePublicUrl(store: StoreResponse): string {
  const d = store.domains?.[0];
  if (d && typeof d === "string") {
    return d.startsWith("http") ? d : `https://${d}`;
  }
  const od = store.original_domain;
  if (od && typeof od === "string") {
    return od.startsWith("http") ? od : `https://${od}`;
  }
  return "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getAppOrigin();

  const back = (params: Record<string, string>) => {
    const u = new URL(`${origin}/dashboard/configuracion`);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return NextResponse.redirect(u.toString());
  };

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = cookies();
  const savedState = cookieStore.get(TN_STATE_COOKIE)?.value;
  cookieStore.delete(TN_STATE_COOKIE);

  if (!state || !savedState || savedState !== state) {
    return back({ tiendanube: "state_mismatch" });
  }

  const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET?.trim();
  const appId = process.env.TIENDANUBE_APP_ID?.trim();
  if (!clientSecret || !appId) {
    return back({ tiendanube: "not_configured" });
  }

  if (url.searchParams.has("hmac")) {
    if (!verifyTiendanubeHmac(url.searchParams, clientSecret)) {
      return back({ tiendanube: "hmac_failed" });
    }
  }

  if (!code) {
    return back({ tiendanube: "error", reason: "missing_code" });
  }

  let tokenJson: TokenResponse;
  try {
    const res = await fetch("https://www.tiendanube.com/apps/authorize/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
      }),
    });
    tokenJson = (await res.json()) as TokenResponse;
    if (!res.ok || !tokenJson.access_token || tokenJson.user_id == null) {
      const reason = encodeURIComponent(
        tokenJson.error_description ||
          tokenJson.error ||
          `http_${res.status}`
      );
      return back({ tiendanube: "error", reason });
    }
  } catch {
    return back({ tiendanube: "error", reason: "network_exchange" });
  }

  const storeId = String(tokenJson.user_id);
  const baseSession: TiendanubeSession = {
    storeId,
    accessToken: tokenJson.access_token!,
    scope: tokenJson.scope ?? "",
    installedAt: Date.now(),
    lastSyncedAt: null,
  };

  let storeName: string | null = null;
  let storeUrl: string | null = null;
  let currency: string | null = null;

  try {
    const storeRes = await tiendanubeFetch(baseSession, "/store?fields=name,country,main_currency,domains,original_domain");
    if (storeRes.ok) {
      const store = (await storeRes.json()) as StoreResponse;
      storeName = normalizeTnText(store.name) || null;
      storeUrl = storePublicUrl(store) || null;
      currency = store.main_currency ?? null;
    }
  } catch {
    // seguimos con sesión mínima
  }

  const session: TiendanubeSession = {
    ...baseSession,
    storeName,
    storeUrl,
    currency,
  };

  cookies().set(TN_SESSION_COOKIE, serializeTiendanubeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    secure: process.env.NODE_ENV === "production",
  });

  return back({ tiendanube: "connected" });
}
