import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ML_STATE_COOKIE, ML_TOKEN_COOKIE } from "@/lib/mercadolibre-auth";
import { getAuthUser } from "@/lib/server/auth-user";
import { deleteUserIntegration } from "@/lib/server/user-integrations";

/** Cierra sesión OAuth de Mercado Libre. POST /api/auth/mercadolibre/disconnect */
export async function POST() {
  const user = await getAuthUser();
  if (user) {
    await deleteUserIntegration(user.id, "mercadolibre");
  }
  const cookieStore = cookies();
  cookieStore.delete(ML_TOKEN_COOKIE);
  cookieStore.delete(ML_STATE_COOKIE);
  return NextResponse.json({ ok: true });
}
