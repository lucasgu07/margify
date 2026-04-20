import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TN_STATE_COOKIE, getAppOrigin } from "@/lib/tiendanube-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inicia OAuth TiendaNube.
 * GET /api/auth/tiendanube → redirect a https://www.tiendanube.com/apps/{APP_ID}/authorize?state=...
 */
export async function GET() {
  const origin = getAppOrigin();
  const back = (params: Record<string, string>) => {
    const u = new URL(`${origin}/dashboard/configuracion`);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return NextResponse.redirect(u.toString());
  };

  const appId = process.env.TIENDANUBE_APP_ID?.trim();
  if (!appId) {
    return back({ tiendanube: "not_configured" });
  }

  const state = crypto.randomBytes(16).toString("hex");
  cookies().set(TN_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
    secure: process.env.NODE_ENV === "production",
  });

  const authUrl = `https://www.tiendanube.com/apps/${encodeURIComponent(
    appId
  )}/authorize?state=${encodeURIComponent(state)}`;
  return NextResponse.redirect(authUrl);
}
