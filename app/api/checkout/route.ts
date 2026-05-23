import { NextResponse } from "next/server";
import { isAllowedDodoProductId } from "@/lib/dodo-products";
import {
  getDodoCheckoutCancelUrl,
  getDodoCheckoutReturnUrl,
  getDodoPaymentsClient,
} from "@/lib/server/dodo-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutBody = {
  product_id?: string;
};

/**
 * Crea una checkout session en Dodo Payments y devuelve la URL de pago.
 * POST /api/checkout  { "product_id": "pdt_..." }
 */
export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const productId = body.product_id?.trim();
  if (!productId) {
    return NextResponse.json({ error: "missing_product_id" }, { status: 400 });
  }
  if (!isAllowedDodoProductId(productId)) {
    return NextResponse.json({ error: "invalid_product_id" }, { status: 400 });
  }

  try {
    const client = getDodoPaymentsClient();
    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: getDodoCheckoutReturnUrl(),
      cancel_url: getDodoCheckoutCancelUrl(),
      metadata: {
        product_id: productId,
        source: "margify_pricing",
      },
      customization: {
        force_language: "es",
      },
    });

    const checkoutUrl = session.checkout_url?.trim();
    if (!checkoutUrl) {
      return NextResponse.json({ error: "missing_checkout_url" }, { status: 502 });
    }

    return NextResponse.json({
      checkout_url: checkoutUrl,
      session_id: session.session_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    console.error("[checkout]", message);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
