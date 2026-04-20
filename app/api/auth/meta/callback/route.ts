import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  META_COOKIE,
  META_GRAPH_BASE,
  META_OAUTH_TOKEN,
  META_STATE_COOKIE,
  getAppOrigin,
  getMetaRedirectUri,
  type MetaAdAccount,
  type MetaSession,
} from "@/lib/meta-auth";

function redirectToConfig(query: Record<string, string>) {
  const u = new URL(`${getAppOrigin()}/dashboard/configuracion`);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
  return NextResponse.redirect(u.toString());
}

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message: string; type?: string; code?: number };
};

type MeResponse = {
  id?: string;
  name?: string;
  error?: { message: string };
};

type AdAccountsResponse = {
  data?: Array<{
    id: string;
    account_id?: string;
    name?: string;
    currency?: string;
  }>;
  error?: { message: string };
};

/**
 * Callback OAuth de Meta:
 *   1. Valida state.
 *   2. Intercambia `code` → short-lived token.
 *   3. Cambia short-lived → long-lived (~60 días).
 *   4. Consulta /me y /me/adaccounts para conocer la identidad y las cuentas publicitarias.
 *   5. Guarda todo en cookie httpOnly `meta_oauth_session`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");

  if (err) {
    return redirectToConfig({
      meta: "error",
      reason: encodeURIComponent(errDesc || err),
    });
  }

  const cookieStore = cookies();
  const savedState = cookieStore.get(META_STATE_COOKIE)?.value;
  cookieStore.delete(META_STATE_COOKIE);

  if (!state || !savedState || state !== savedState) {
    return redirectToConfig({ meta: "error", reason: "state_invalido" });
  }
  if (!code) {
    return redirectToConfig({ meta: "error", reason: "sin_codigo" });
  }

  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    return redirectToConfig({ meta: "error", reason: "faltan_credenciales_servidor" });
  }
  const redirectUri = getMetaRedirectUri();

  let accessToken = "";
  let expiresIn: number | null = null;
  let tokenType: string | null = null;

  try {
    const shortUrl = new URL(META_OAUTH_TOKEN);
    shortUrl.searchParams.set("client_id", appId);
    shortUrl.searchParams.set("client_secret", appSecret);
    shortUrl.searchParams.set("redirect_uri", redirectUri);
    shortUrl.searchParams.set("code", code);

    const shortRes = await fetch(shortUrl.toString(), { method: "GET" });
    const shortJson = (await shortRes.json()) as TokenResponse;
    if (!shortRes.ok || !shortJson.access_token) {
      const reason = encodeURIComponent(shortJson.error?.message || "intercambio_fallo");
      return redirectToConfig({ meta: "error", reason });
    }

    const longUrl = new URL(META_OAUTH_TOKEN);
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", appId);
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("fb_exchange_token", shortJson.access_token);

    const longRes = await fetch(longUrl.toString(), { method: "GET" });
    const longJson = (await longRes.json()) as TokenResponse;
    if (!longRes.ok || !longJson.access_token) {
      accessToken = shortJson.access_token;
      expiresIn = shortJson.expires_in ?? null;
      tokenType = shortJson.token_type ?? null;
    } else {
      accessToken = longJson.access_token;
      expiresIn = longJson.expires_in ?? null;
      tokenType = longJson.token_type ?? null;
    }
  } catch {
    return redirectToConfig({ meta: "error", reason: "red_token" });
  }

  let userId: string | null = null;
  let userName: string | null = null;
  let adAccounts: MetaAdAccount[] = [];

  try {
    const meRes = await fetch(
      `${META_GRAPH_BASE}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
    );
    const me = (await meRes.json()) as MeResponse;
    if (!me.error) {
      userId = me.id ?? null;
      userName = me.name ?? null;
    }
  } catch {
    /* seguimos sin datos de identidad */
  }

  try {
    const adRes = await fetch(
      `${META_GRAPH_BASE}/me/adaccounts?fields=id,name,account_id,currency&limit=50&access_token=${encodeURIComponent(accessToken)}`
    );
    const ads = (await adRes.json()) as AdAccountsResponse;
    adAccounts = (ads.data ?? []).map((a) => ({
      id: a.id,
      account_id: a.account_id ?? a.id.replace(/^act_/, ""),
      name: a.name ?? "(sin nombre)",
      currency: a.currency ?? null,
    }));
  } catch {
    adAccounts = [];
  }

  const session: MetaSession = {
    access_token: accessToken,
    token_type: tokenType,
    expires_in: expiresIn,
    obtained_at: Date.now(),
    user_id: userId,
    user_name: userName,
    ad_account_id: adAccounts[0]?.id ?? null,
    ad_accounts: adAccounts,
    last_synced_at: null,
  };

  cookies().set(META_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 55,
    secure: process.env.NODE_ENV === "production",
  });

  return redirectToConfig({ meta: "connected" });
}
