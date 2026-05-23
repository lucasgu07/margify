import type { CostsConfigInput } from "@/lib/server/user-costs";
import type { ShopifyOrder } from "@/lib/shopify-auth";
import type { TiendanubeOrder } from "@/lib/tiendanube-auth";
import type { MlOrder } from "@/lib/integrations/mercadolibre-orders";
import type { Order, OrderChannel } from "@/types";

function applyCosts(revenue: number, costs: CostsConfigInput) {
  return {
    product_cost: (revenue * costs.product_cost_percent) / 100,
    payment_commission: (revenue * costs.payment_commission_percent) / 100,
    shipping_cost: costs.shipping_cost_fixed,
  };
}

function lineItemLabel(
  lineItems: { title: string; quantity: number }[],
  fallback: string
): string {
  if (!lineItems.length) return fallback;
  return lineItems.map((li) => li.title).join(", ");
}

function tnIsCompleted(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s.includes("closed") ||
    s.includes("paid") ||
    s.includes("completed") ||
    s === "open" ||
    s === ""
  );
}

export function shopifyOrdersToMargify(
  orders: ShopifyOrder[],
  storeId: string,
  costs: CostsConfigInput
): Order[] {
  return orders.map((o) => {
    const revenue = o.total;
    const c = applyCosts(revenue, costs);
    return {
      id: `sh-${o.id}`,
      store_id: storeId,
      external_id: o.id,
      date: o.createdAt.slice(0, 10),
      revenue,
      product_name: lineItemLabel(o.lineItems, o.name),
      product_cost: c.product_cost,
      shipping_cost: c.shipping_cost,
      payment_commission: c.payment_commission,
      channel: "Shopify" as OrderChannel,
      status: "completed",
    };
  });
}

export function tiendanubeOrdersToMargify(
  orders: TiendanubeOrder[],
  storeId: string,
  costs: CostsConfigInput
): Order[] {
  return orders
    .filter((o) => tnIsCompleted(o.status))
    .map((o) => {
      const revenue = o.total;
      const c = applyCosts(revenue, costs);
      return {
        id: `tn-${o.id}`,
        store_id: storeId,
        external_id: o.id,
        date: o.createdAt.slice(0, 10),
        revenue,
        product_name: lineItemLabel(o.lineItems, o.name),
        product_cost: c.product_cost,
        shipping_cost: c.shipping_cost,
        payment_commission: c.payment_commission,
        channel: "TiendaNube" as OrderChannel,
        status: "completed",
      };
    });
}

export function mercadolibreOrdersToMargify(
  orders: MlOrder[],
  storeId: string,
  costs: CostsConfigInput
): Order[] {
  return orders.map((o) => {
    const revenue = o.total_amount;
    const c = applyCosts(revenue, costs);
    const lineItems = (o.order_items ?? []).map((li) => ({
      title: li.item?.title ?? "Producto ML",
      quantity: li.quantity,
    }));
    return {
      id: `ml-${o.id}`,
      store_id: storeId,
      external_id: String(o.id),
      date: o.date_created.slice(0, 10),
      revenue,
      product_name: lineItemLabel(lineItems, `Orden ML #${o.id}`),
      product_cost: c.product_cost,
      shipping_cost: c.shipping_cost,
      payment_commission: c.payment_commission,
      channel: "MercadoLibre" as OrderChannel,
      status: "completed",
    };
  });
}
