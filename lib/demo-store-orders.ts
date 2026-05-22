import { mockOrders } from "@/lib/mock-data";
import type { Order, OrderChannel } from "@/types";
import type { ShopifyMetrics, ShopifyOrder } from "@/lib/shopify-auth";
import type { TiendanubeMetrics, TiendanubeOrder } from "@/lib/tiendanube-auth";

const DEMO_CURRENCY = "ARS";
const DEMO_LOOKBACK_DAYS = 30;

function recentCompletedByChannel(channel: OrderChannel, max = 14): Order[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DEMO_LOOKBACK_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return mockOrders
    .filter((o) => o.channel === channel && o.status === "completed" && o.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, max);
}

function toShopifyOrder(o: Order, index: number): ShopifyOrder {
  const subtotal = Math.round(o.revenue * 0.92 * 100) / 100;
  return {
    id: o.id,
    name: `#SH${1000 + index}`,
    createdAt: `${o.date}T15:20:00.000Z`,
    customerEmail: `cliente.shopify${index + 1}@demo.margify.app`,
    itemsCount: 1 + (index % 3),
    subtotal,
    total: o.revenue,
    currency: DEMO_CURRENCY,
    lineItems: [{ title: o.product_name, quantity: 1 + (index % 2) }],
  };
}

function toTiendanubeOrder(o: Order, index: number): TiendanubeOrder {
  const subtotal = Math.round(o.revenue * 0.9 * 100) / 100;
  return {
    id: o.id,
    name: `#TN${2000 + index}`,
    createdAt: `${o.date}T11:45:00.000Z`,
    customerEmail: `cliente.tn${index + 1}@demo.margify.app`,
    itemsCount: 1 + (index % 2),
    subtotal,
    total: o.revenue,
    currency: DEMO_CURRENCY,
    lineItems: [{ title: o.product_name, quantity: 1 }],
    status: "closed",
  };
}

function buildMetrics<T extends { total: number }>(orders: T[]): ShopifyMetrics {
  const totalRevenue = orders.reduce((a, o) => a + o.total, 0);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  return {
    totalRevenue,
    totalOrders,
    aov,
    topProducts: [],
    ordersByDay: [],
  };
}

export const demoShopifyOrders: ShopifyOrder[] = recentCompletedByChannel("Shopify").map(toShopifyOrder);
export const demoTiendanubeOrders: TiendanubeOrder[] = recentCompletedByChannel("TiendaNube").map(
  toTiendanubeOrder
);

export const demoShopifyMetrics: ShopifyMetrics = buildMetrics(demoShopifyOrders);
export const demoTiendanubeMetrics: TiendanubeMetrics = buildMetrics(demoTiendanubeOrders);

export const DEMO_SHOPIFY_SHOP = "mi-marca.myshopify.com";
export const DEMO_TIENDANUBE_STORE = "mitienda";
