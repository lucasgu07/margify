import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GOOGLE_ADS_SCOPE,
  GOOGLE_ADS_STATE_COOKIE,
  GOOGLE_OAUTH_AUTH_URL,
  getGoogleAdsRedirectUri,
} from "@/lib/google-ads";

/**
 * Inicia OAuth contra Google. `access_type=offline` + `prompt=consent` nos asegura
 * un refresh_token (aunque el usuario ya haya autorizado antes).
 */
export async function GET() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.json(
      { error: "Falta configurar GOOGLE_ADS_CLIENT_ID en el servidor." },
      { status: 500 }
    );
  }

  const redirectUri = getGoogleAdsRedirectUri();
  const state = crypto.randomUUID();

  cookies().set(GOOGLE_ADS_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
    secure: process.env.NODE_ENV === "production",
  });

  const url = new URL(GOOGLE_OAUTH_AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", GOOGLE_ADS_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
