import { NextResponse } from "next/server";

/** Redirige al flujo OAuth unificado. */
export async function GET() {
  return NextResponse.redirect(new URL("/api/auth/tiktok", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
