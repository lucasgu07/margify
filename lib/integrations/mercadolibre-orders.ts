import type { MlSession } from "@/lib/mercadolibre-auth";

export type MlOrderItem = {
  item: { title?: string };
  quantity: number;
  unit_price: number;
};

export type MlOrder = {
  id: number;
  date_created: string;
  status: string;
  total_amount: number;
  order_items: MlOrderItem[];
};

type SearchResponse = {
  results?: number[];
  paging?: { total: number; offset: number; limit: number };
  error?: string;
  message?: string;
};

type OrderResponse = MlOrder & { error?: string; message?: string };

export async function fetchMercadoLibreOrders(
  session: MlSession,
  days = 90
): Promise<{ ok: true; orders: MlOrder[] } | { ok: false; error: string }> {
  const sellerId = session.user_id;
  if (!sellerId) {
    return { ok: false, error: "no_seller_id" };
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const orders: MlOrder[] = [];
  let offset = 0;
  const limit = 50;

  for (let page = 0; page < 6; page++) {
    const url =
      `https://api.mercadolibre.com/orders/search?seller=${sellerId}` +
      `&sort=date_desc&order.status=paid&limit=${limit}&offset=${offset}` +
      `&order.date_created.from=${encodeURIComponent(since)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "token_invalid" };
    }

    const search = (await res.json()) as SearchResponse;
    if (search.error || search.message) {
      return { ok: false, error: search.message || search.error || "search_failed" };
    }

    const ids = search.results ?? [];
    if (!ids.length) break;

    for (const id of ids) {
      const detailRes = await fetch(`https://api.mercadolibre.com/orders/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (!detailRes.ok) continue;
      const order = (await detailRes.json()) as OrderResponse;
      if (order.id && order.status === "paid") {
        orders.push(order);
      }
    }

    if (ids.length < limit) break;
    offset += limit;
  }

  return { ok: true, orders };
}
