import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TN_SESSION_COOKIE, TN_STATE_COOKIE } from "@/lib/tiendanube-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete(TN_SESSION_COOKIE);
  cookieStore.delete(TN_STATE_COOKIE);
  return NextResponse.json({ ok: true });
}
