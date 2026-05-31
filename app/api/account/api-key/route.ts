import { NextResponse } from "next/server";
import { canUseApiAccess } from "@/lib/plan-features";
import { generateApiKey, setUserApiKey } from "@/lib/server/api-keys";
import { getAuthUser } from "@/lib/server/auth-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/account/api-key — genera o regenera API key (plan Pro+).
 * La clave se muestra una sola vez en la respuesta.
 */
export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canUseApiAccess(user.plan)) {
    return NextResponse.json(
      { error: "api_requires_pro", message: "API access requiere plan Pro o Scale." },
      { status: 403 }
    );
  }

  const apiKey = generateApiKey();
  const ok = await setUserApiKey(user.id, apiKey);
  if (!ok) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    api_key: apiKey,
    usage: "Authorization: Bearer <api_key> en GET /api/v1/metrics",
  });
}
