import {
  normalizeTnText,
  parseLinkNextUrl,
  tiendanubeApiBase,
  tiendanubeFetchUrl,
  type TiendanubeOrder,
  type TiendanubeOrderLineItem,
  type TiendanubeSession,
} from "@/lib/tiendanube-auth";

const MAX_PAGES = 20;

type RawOrderLine = {
  name?: string | Record<string, string>;
  quantity?: string | number;
};

type RawOrder = {
  id: number | string;
  number?: number;
  created_at: string;
  contact_email?: string | null;
  customer?: { email?: string | null } | null;
  products?: RawOrderLine[];
  subtotal?: string;
  total?: string;
  currency?: string | null;
  status?: string;
};

function parseMoney(s: string | undefined | null): number {
  if (s == null || s === "") return 0;
  const n = Number(String(s));
  return Number.isFinite(n) ? n : 0;
}

function mapOrder(raw: RawOrder): TiendanubeOrder {
  const lineItems: TiendanubeOrderLineItem[] = (raw.products ?? []).map((li) => ({
    title: typeof li.name === "string" ? li.name : normalizeTnText(li.name ?? {}),
    quantity:
      typeof li.quantity === "string" ? Number(li.quantity) || 0 : Number(li.quantity) || 0,
  }));
  const itemsCount = lineItems.reduce((a, b) => a + b.quantity, 0);
  return {
    id: String(raw.id),
    name: `#${raw.number ?? raw.id}`,
    createdAt: raw.created_at,
    customerEmail: raw.customer?.email ?? raw.contact_email ?? null,
    itemsCount,
    subtotal: parseMoney(raw.subtotal),
    total: parseMoney(raw.total),
    currency: raw.currency ?? null,
    lineItems,
    status: raw.status ?? "",
  };
}

async function fetchAllPaged<T>(
  session: TiendanubeSession,
  pathAndQuery: string
): Promise<{ ok: true; items: T[] } | { ok: false; error: string }> {
  const base = tiendanubeApiBase(session.storeId);
  const first = `${base}${pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`}`;
  let nextUrl: string | null = first;
  const items: T[] = [];

  for (let i = 0; i < MAX_PAGES && nextUrl; i++) {
    const res = await tiendanubeFetchUrl(session, nextUrl);
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "token_invalid" };
    }
    if (!res.ok) {
      return { ok: false, error: `http_${res.status}` };
    }
    const chunk = (await res.json()) as unknown;
    if (Array.isArray(chunk)) items.push(...(chunk as T[]));
    nextUrl = parseLinkNextUrl(res.headers.get("link"));
  }
  return { ok: true, items };
}

export async function fetchTiendanubeOrders(
  session: TiendanubeSession,
  days = 30
): Promise<{ ok: true; orders: TiendanubeOrder[] } | { ok: false; error: string }> {
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const createdMin = encodeURIComponent(sinceIso);
  const ordersPath =
    `/orders?per_page=100&created_at_min=${createdMin}` +
    "&fields=id,number,created_at,customer,products,subtotal,total,currency,status,contact_email";

  const ordersRes = await fetchAllPaged<RawOrder>(session, ordersPath);
  if (!ordersRes.ok) return ordersRes;
  return { ok: true, orders: ordersRes.items.map(mapOrder) };
}
