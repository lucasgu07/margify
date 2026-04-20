import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  TN_SESSION_COOKIE,
  normalizeTnText,
  parseLinkNextUrl,
  parseTiendanubeSession,
  serializeTiendanubeSession,
  tiendanubeApiBase,
  tiendanubeFetchUrl,
  type TiendanubeMetrics,
  type TiendanubeOrder,
  type TiendanubeOrderLineItem,
  type TiendanubeProduct,
  type TiendanubeSession,
} from "@/lib/tiendanube-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PAGES = 20;

type RawVariant = {
  price?: string | null;
  promotional_price?: string | null;
  stock?: number | string | null;
  stock_management?: boolean;
};

type RawProduct = {
  id: number;
  name: Record<string, string> | string;
  brand?: string | null | Record<string, string>;
  published?: boolean;
  variants?: RawVariant[];
};

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

function variantUnitPrice(v: RawVariant): number {
  const promo = v.promotional_price;
  if (promo != null && String(promo).trim() !== "") {
    const p = parseMoney(promo);
    if (p > 0) return p;
  }
  return parseMoney(v.price);
}

function brandLabel(
  b: string | null | undefined | Record<string, string>
): string | null {
  if (b == null) return null;
  if (typeof b === "string") return b || null;
  const t = normalizeTnText(b);
  return t || null;
}

function mapProduct(raw: RawProduct, storeCurrency: string | null): TiendanubeProduct {
  const variants = raw.variants ?? [];
  let totalStock = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const v of variants) {
    if (v.stock_management) {
      const st = typeof v.stock === "string" ? Number(v.stock) : v.stock;
      if (st != null && Number.isFinite(st)) totalStock += st;
    }
    const price = variantUnitPrice(v);
    if (price < min) min = price;
    if (price > max) max = price;
  }
  if (min === Infinity) min = 0;
  if (max === -Infinity) max = 0;
  return {
    id: String(raw.id),
    title: normalizeTnText(raw.name),
    brand: brandLabel(raw.brand ?? null),
    published: Boolean(raw.published),
    totalInventory: totalStock,
    priceMin: min,
    priceMax: max,
    currency: storeCurrency,
  };
}

function mapOrder(raw: RawOrder): TiendanubeOrder {
  const lineItems: TiendanubeOrderLineItem[] = (raw.products ?? []).map((li) => ({
    title:
      typeof li.name === "string"
        ? li.name
        : normalizeTnText(li.name ?? {}),
    quantity:
      typeof li.quantity === "string"
        ? Number(li.quantity) || 0
        : Number(li.quantity) || 0,
  }));
  const itemsCount = lineItems.reduce((a, b) => a + b.quantity, 0);
  const email =
    raw.customer?.email ?? raw.contact_email ?? null;
  return {
    id: String(raw.id),
    name: `#${raw.number ?? raw.id}`,
    createdAt: raw.created_at,
    customerEmail: email,
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
): Promise<{ ok: true; items: T[] } | { ok: false; status: number }> {
  const base = tiendanubeApiBase(session.storeId);
  const first = `${base}${pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`}`;
  let nextUrl: string | null = first;
  const items: T[] = [];

  for (let i = 0; i < MAX_PAGES && nextUrl; i++) {
    const res = await tiendanubeFetchUrl(session, nextUrl);
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: res.status };
    }
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    const chunk = (await res.json()) as unknown;
    if (Array.isArray(chunk)) {
      items.push(...(chunk as T[]));
    }
    nextUrl = parseLinkNextUrl(res.headers.get("link"));
  }
  return { ok: true, items };
}

export async function POST() {
  const cookieStore = cookies();
  const session = parseTiendanubeSession(
    cookieStore.get(TN_SESSION_COOKIE)?.value
  );
  if (!session) {
    return NextResponse.json(
      { error: "Tienda no conectada. Conectá TiendaNube desde Configuración." },
      { status: 401 }
    );
  }

  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const createdMin = encodeURIComponent(sinceIso);
  const ordersPath =
    `/orders?per_page=100&created_at_min=${createdMin}` +
    "&fields=id,number,created_at,customer,products,subtotal,total,currency,status,contact_email";
  const productsPath =
    "/products?per_page=50&fields=id,name,variants,published,brand";

  try {
    const [productsRes, ordersRes] = await Promise.all([
      fetchAllPaged<RawProduct>(session, productsPath),
      fetchAllPaged<RawOrder>(session, ordersPath),
    ]);

    if (!productsRes.ok || !ordersRes.ok) {
      const st = !productsRes.ok
        ? productsRes.status
        : !ordersRes.ok
          ? ordersRes.status
          : 500;
      if (st === 401 || st === 403) {
        return NextResponse.json(
          { error: "token_invalid", message: "Sesión inválida o sin permisos." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          error: "api_error",
          message: `Error en la API de TiendaNube (HTTP ${st}).`,
        },
        { status: 502 }
      );
    }

    const storeCurrency = session.currency ?? null;
    const products: TiendanubeProduct[] = productsRes.items.map((p) =>
      mapProduct(p, storeCurrency)
    );
    const orders: TiendanubeOrder[] = ordersRes.items.map(mapOrder);

    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productAgg = new Map<string, number>();
    for (const o of orders) {
      for (const li of o.lineItems) {
        const key = li.title || "—";
        productAgg.set(key, (productAgg.get(key) ?? 0) + li.quantity);
      }
    }
    const topProducts = Array.from(productAgg.entries())
      .map(([title, quantity]) => ({ title, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders) {
      const d = o.createdAt.slice(0, 10);
      const curr = byDay.get(d) ?? { revenue: 0, orders: 0 };
      curr.revenue += o.total;
      curr.orders += 1;
      byDay.set(d, curr);
    }
    const ordersByDay = Array.from(byDay.entries())
      .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const metrics: TiendanubeMetrics = {
      totalRevenue,
      totalOrders,
      aov,
      topProducts,
      ordersByDay,
    };

    const now = Date.now();
    const updated: TiendanubeSession = { ...session, lastSyncedAt: now };
    cookieStore.set(TN_SESSION_COOKIE, serializeTiendanubeSession(updated), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({
      ok: true,
      storeId: session.storeId,
      products,
      orders,
      metrics,
      syncedAt: now,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "network", message: `No se pudo sincronizar con TiendaNube: ${msg}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
