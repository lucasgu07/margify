import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SHOPIFY_SESSION_COOKIE,
  SHOPIFY_STATE_COOKIE,
} from "@/lib/shopify-auth";

export const dynamic = "force-dynamic";

/** Borra las cookies de sesión de Shopify. */
export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete(SHOPIFY_SESSION_COOKIE);
  cookieStore.delete(SHOPIFY_STATE_COOKIE);
  return NextResponse.json({ ok: true });
}
