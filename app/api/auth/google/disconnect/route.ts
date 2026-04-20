import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_ADS_COOKIE, GOOGLE_ADS_STATE_COOKIE } from "@/lib/google-ads";

/** Borra las cookies de sesión de Google Ads. */
export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete(GOOGLE_ADS_COOKIE);
  cookieStore.delete(GOOGLE_ADS_STATE_COOKIE);
  return NextResponse.json({ ok: true });
}
