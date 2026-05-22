import {
  shopifyAdminGraphqlUrl,
  type ShopifyOrder,
  type ShopifyOrderLineItem,
  type ShopifySession,
} from "@/lib/shopify-auth";

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type OrdersQueryData = {
  orders: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        createdAt: string;
        customer: { email: string | null } | null;
        subtotalPriceSet: { shopMoney: { amount: string } } | null;
        totalPriceSet: { shopMoney: { amount: string; currencyCode: string } } | null;
        lineItems: {
          edges: Array<{ node: { title: string; quantity: number } }>;
        };
      };
    }>;
  };
};

const ORDERS_QUERY = /* GraphQL */ `
  query MargifyOrders($query: String!) {
    orders(first: 100, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          customer { email }
          subtotalPriceSet { shopMoney { amount } }
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

export async function fetchShopifyOrders(
  session: ShopifySession,
  days = 30
): Promise<{ ok: true; orders: ShopifyOrder[] } | { ok: false; error: string }> {
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const res = await fetch(shopifyAdminGraphqlUrl(session.shop), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken,
    },
    body: JSON.stringify({
      query: ORDERS_QUERY,
      variables: { query: `created_at:>=${sinceIso}` },
    }),
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: "token_invalid" };
  }

  const json = (await res.json().catch(() => ({}))) as GraphqlResponse<OrdersQueryData>;
  if (json.errors?.length) {
    const msg = json.errors[0]?.message ?? "graphql_error";
    if (/access|permission|unauthor|token/i.test(msg)) {
      return { ok: false, error: "token_invalid" };
    }
    return { ok: false, error: msg };
  }

  const orders: ShopifyOrder[] = (json.data?.orders.edges ?? []).map((e) => {
    const n = e.node;
    const lineItems: ShopifyOrderLineItem[] = (n.lineItems.edges ?? []).map((li) => ({
      title: li.node.title,
      quantity: toNumber(li.node.quantity),
    }));
    const itemsCount = lineItems.reduce((acc, li) => acc + li.quantity, 0);
    return {
      id: n.id,
      name: n.name,
      createdAt: n.createdAt,
      customerEmail: n.customer?.email ?? null,
      itemsCount,
      subtotal: toNumber(n.subtotalPriceSet?.shopMoney.amount),
      total: toNumber(n.totalPriceSet?.shopMoney.amount),
      currency: n.totalPriceSet?.shopMoney.currencyCode ?? null,
      lineItems,
    };
  });

  return { ok: true, orders };
}
