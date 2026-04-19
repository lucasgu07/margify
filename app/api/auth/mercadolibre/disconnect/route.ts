import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ML_STATE_COOKIE, ML_TOKEN_COOKIE } from "@/lib/mercadolibre-auth";

/** Cierra sesión OAuth de Mercado Libre (borra cookie). POST /api/auth/mercadolibre/disconnect */
export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete(ML_TOKEN_COOKIE);
  cookieStore.delete(ML_STATE_COOKIE);
  return NextResponse.json({ ok: true });
}
