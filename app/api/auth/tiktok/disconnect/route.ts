import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TIKTOK_COOKIE, TIKTOK_STATE_COOKIE } from "@/lib/tiktok-auth";
import { getAuthUser } from "@/lib/server/auth-user";
import { deleteUserIntegration } from "@/lib/server/user-integrations";

export async function POST() {
  const user = await getAuthUser();
  if (user) await deleteUserIntegration(user.id, "tiktok");
  const cookieStore = cookies();
  cookieStore.delete(TIKTOK_COOKIE);
  cookieStore.delete(TIKTOK_STATE_COOKIE);
  return NextResponse.json({ ok: true });
}
