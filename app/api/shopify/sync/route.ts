import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SHOPIFY_SESSION_COOKIE,
  parseShopifySession,
  serializeShopifySession,
  shopifyAdminGraphqlUrl,
  type ShopifyMetrics,
  type ShopifyOrder,
  type ShopifyOrderLineItem,
  type ShopifyProduct,
  type ShopifySession,
} from "@/lib/shopify-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
};

type ProductsQueryData = {
  products: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        vendor: string | null;
        status: string;
        totalInventory: number | null;
        priceRangeV2: {
          minVariantPrice: { amount: string; currencyCode: string };
          maxVariantPrice: { amount: string; currencyCode: string };
        } | null;
      };
    }>;
  };
};

type OrdersQueryData = {
  orders: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        createdAt: string;
        customer: { id: string | null; email: string | null } | null;
        subtotalPriceSet: {
          shopMoney: { amount: string; currencyCode: string };
        } | null;
        totalPriceSet: {
          shopMoney: { amount: string; currencyCode: string };
        } | null;
        lineItems: {
          edges: Array<{
            node: { title: string; quantity: number };
          }>;
        };
      };
    }>;
  };
};

const PRODUCTS_QUERY = /* GraphQL */ `
  query MargifyProducts {
    products(first: 50, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          vendor
          status
          totalInventory
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
`;

const ORDERS_QUERY = /* GraphQL */ `
  query MargifyOrders($query: String!) {
    orders(first: 100, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          customer { id email }
          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalPriceSet { shopMoney { amount currencyCode } }
          lineItems(first: 5) {
            edges { node { title quantity } }
          }
        }
      }
    }
  }
`;

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

async function shopifyGraphql<T>(
  session: ShopifySession,
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphqlResponse<T> & { status: number }> {
  const res = await fetch(shopifyAdminGraphqlUrl(session.shop), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as GraphqlResponse<T>;
  return { ...json, status: res.status };
}

/**
 * Sincroniza productos (últimos 50) + pedidos (últimos 30 días) de Shopify.
 * POST /api/shopify/sync
 */
export async function POST() {
  const cookieStore = cookies();
  const session = parseShopifySession(cookieStore.get(SHOPIFY_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json(
      { error: "Tienda no conectada. Conectá Shopify desde Configuración." },
      { status: 401 }
    );
  }

  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const ordersQueryString = `created_at:>=${sinceIso}`;

  try {
    const [productsRes, ordersRes] = await Promise.all([
      shopifyGraphql<ProductsQueryData>(session, PRODUCTS_QUERY),
      shopifyGraphql<OrdersQueryData>(session, ORDERS_QUERY, {
        query: ordersQueryString,
      }),
    ]);

    if (productsRes.status === 401 || ordersRes.status === 401 ||
        productsRes.status === 403 || ordersRes.status === 403) {
      return NextResponse.json(
        {
          error: "token_invalid",
          message:
            "La sesión con Shopify expiró o no tiene permisos. Reconectá la tienda.",
        },
        { status: 401 }
      );
    }

    const gqlErrors = [
      ...(productsRes.errors ?? []),
      ...(ordersRes.errors ?? []),
    ];
    if (gqlErrors.length > 0) {
      const firstMsg = gqlErrors[0]?.message ?? "Error en Shopify GraphQL";
      const isAuth = /access|permission|unauthor|token/i.test(firstMsg);
      if (isAuth) {
        return NextResponse.json(
          { error: "token_invalid", message: firstMsg },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "graphql", message: firstMsg },
        { status: 500 }
      );
    }

    const products: ShopifyProduct[] = (productsRes.data?.products.edges ?? []).map(
      (e) => {
        const n = e.node;
        const min = n.priceRangeV2?.minVariantPrice;
        const max = n.priceRangeV2?.maxVariantPrice;
        return {
          id: n.id,
          title: n.title,
          vendor: n.vendor ?? null,
          status: n.status,
          totalInventory: toNumber(n.totalInventory),
          priceMin: toNumber(min?.amount),
          priceMax: toNumber(max?.amount),
          currency: min?.currencyCode ?? max?.currencyCode ?? null,
        };
      }
    );

    const orders: ShopifyOrder[] = (ordersRes.data?.orders.edges ?? []).map((e) => {
      const n = e.node;
      const lineItems: ShopifyOrderLineItem[] = (n.lineItems.edges ?? []).map(
        (li) => ({
          title: li.node.title,
          quantity: toNumber(li.node.quantity),
        })
      );
      const itemsCount = lineItems.reduce((acc, li) => acc + li.quantity, 0);
      return {
        id: n.id,
        name: n.name,
        createdAt: n.createdAt,
        customerEmail: n.customer?.email ?? null,
        itemsCount,
        subtotal: toNumber(n.subtotalPriceSet?.shopMoney.amount),
        total: toNumber(n.totalPriceSet?.shopMoney.amount),
        currency:
          n.totalPriceSet?.shopMoney.currencyCode ??
          n.subtotalPriceSet?.shopMoney.currencyCode ??
          null,
        lineItems,
      };
    });

    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productAgg = new Map<string, number>();
    for (const o of orders) {
      for (const li of o.lineItems) {
        productAgg.set(li.title, (productAgg.get(li.title) ?? 0) + li.quantity);
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

    const metrics: ShopifyMetrics = {
      totalRevenue,
      totalOrders,
      aov,
      topProducts,
      ordersByDay,
    };

    const now = Date.now();
    const updated: ShopifySession = { ...session, lastSyncedAt: now };
    cookieStore.set(SHOPIFY_SESSION_COOKIE, serializeShopifySession(updated), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({
      ok: true,
      shop: session.shop,
      syncedAt: now,
      products,
      orders,
      metrics,
      lastSyncedAt: now,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "network", message: `No se pudo sincronizar con Shopify: ${msg}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
