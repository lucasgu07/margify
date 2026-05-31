import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SHOPIFY_SESSION_COOKIE, SHOPIFY_STATE_COOKIE } from "@/lib/shopify-auth";
import { getAuthUser } from "@/lib/server/auth-user";
import { deleteUserIntegration } from "@/lib/server/user-integrations";

export const dynamic = "force-dynamic";

/** Borra las cookies de sesión de Shopify. */
export async function POST() {
  const user = await getAuthUser();
  if (user) await deleteUserIntegration(user.id, "shopify");
  const cookieStore = cookies();
  cookieStore.delete(SHOPIFY_SESSION_COOKIE);
  cookieStore.delete(SHOPIFY_STATE_COOKIE);
  return NextResponse.json({ ok: true });
}
