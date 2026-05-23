import { NextResponse } from "next/server";
import { isAllowedDodoProductId } from "@/lib/dodo-products";
import { getAuthUser } from "@/lib/server/auth-user";
import {
  billingPatchFromActivateReturn,
  mergeUserBillingMetadata,
} from "@/lib/server/user-billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tras volver del checkout de Dodo: activa trial Pro/Scale en metadata hasta que llegue el webhook.
 * POST { "product_id": "pdt_..." }
 */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { product_id?: string };
  try {
    body = (await request.json()) as { product_id?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const productId = body.product_id?.trim();
  if (!productId || !isAllowedDodoProductId(productId)) {
    return NextResponse.json({ error: "invalid_product_id" }, { status: 400 });
  }

  const ok = await mergeUserBillingMetadata(user.id, billingPatchFromActivateReturn(productId));
  if (!ok) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
