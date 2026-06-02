import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TIKTOK_STATE_COOKIE, getTikTokAuthUrl } from "@/lib/tiktok-auth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/tiktok — inicia OAuth TikTok Ads. */
export async function GET() {
  const state = randomBytes(16).toString("hex");
  try {
    const url = getTikTokAuthUrl(state);
    cookies().set(TIKTOK_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
      secure: process.env.NODE_ENV === "production",
    });
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/integraciones?tiktok=error&reason=missing_app_id`
    );
  }
}
