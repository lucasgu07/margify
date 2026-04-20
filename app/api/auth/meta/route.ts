import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  META_OAUTH_DIALOG,
  META_SCOPE,
  META_STATE_COOKIE,
  getMetaRedirectUri,
} from "@/lib/meta-auth";

/**
 * Inicia OAuth con Meta.
 * GET /api/auth/meta
 */
export async function GET() {
  const appId = process.env.META_APP_ID?.trim();
  if (!appId) {
    return NextResponse.json(
      { error: "Falta META_APP_ID en el servidor." },
      { status: 500 }
    );
  }

  const redirectUri = getMetaRedirectUri();
  const state = crypto.randomUUID();

  cookies().set(META_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
    secure: process.env.NODE_ENV === "production",
  });

  const url = new URL(META_OAUTH_DIALOG);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPE);

  return NextResponse.redirect(url.toString());
}
