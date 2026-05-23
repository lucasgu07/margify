import { NextResponse } from "next/server";
import { getDodoPaymentsClient } from "@/lib/server/dodo-payments";
import {
  applyPaymentFailedWebhook,
  applyPaymentSucceededWebhook,
  applySubscriptionWebhook,
} from "@/lib/server/user-billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhooks de Dodo Payments (suscripciones y pagos).
 * Configurar en Dodo → Developer → Webhooks → https://margify.app/api/webhooks/dodo
 */
export async function POST(request: Request) {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim();
  if (!webhookKey) {
    console.error("[dodo webhook] missing DODO_PAYMENTS_WEBHOOK_KEY");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
  };

  let event;
  try {
    const client = getDodoPaymentsClient();
    event = client.webhooks.unwrap(rawBody, { headers, key: webhookKey });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid_signature";
    console.error("[dodo webhook] verify failed:", msg);
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "subscription.active":
      case "subscription.updated":
      case "subscription.renewed":
        await applySubscriptionWebhook(event.data, event.type);
        break;
      case "subscription.on_hold":
      case "subscription.cancelled":
      case "subscription.expired":
      case "subscription.failed":
        await applySubscriptionWebhook(event.data, event.type);
        break;
      case "payment.succeeded":
        await applyPaymentSucceededWebhook(event.data);
        break;
      case "payment.failed":
        await applyPaymentFailedWebhook(event.data);
        break;
      default:
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "handler_failed";
    console.error("[dodo webhook] handler:", msg);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
