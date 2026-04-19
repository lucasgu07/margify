import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getMercadoLibreAuthBase,
  getMercadoLibreRedirectUri,
  ML_STATE_COOKIE,
} from "@/lib/mercadolibre-auth";

/**
 * Inicia OAuth: redirige a Mercado Libre.
 * GET /api/auth/mercadolibre
 */
export async function GET() {
  const appId = process.env.MERCADOLIBRE_APP_ID?.trim();
  if (!appId) {
    return NextResponse.json(
      { error: "Falta MERCADOLIBRE_APP_ID en variables de entorno." },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = getMercadoLibreRedirectUri();
  const authBase = getMercadoLibreAuthBase();

  const cookieStore = cookies();
  cookieStore.set(ML_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = new URL(`${authBase.replace(/\/$/, "")}/authorization`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
