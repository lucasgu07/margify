import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { META_COOKIE, META_STATE_COOKIE } from "@/lib/meta-auth";
import { getAuthUser } from "@/lib/server/auth-user";
import { deleteUserIntegration } from "@/lib/server/user-integrations";

/** Borra las cookies de sesión de Meta Ads. */
export async function POST() {
  const user = await getAuthUser();
  if (user) await deleteUserIntegration(user.id, "meta");
  const cookieStore = cookies();
  cookieStore.delete(META_COOKIE);
  cookieStore.delete(META_STATE_COOKIE);
  return NextResponse.json({ ok: true });
}
