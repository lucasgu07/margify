/**
 * Helpers OAuth + Admin API de Shopify.
 *
 * Flujo OAuth (Shopify):
 *   1. Usuario escribe su shop: "mi-tienda.myshopify.com"
 *   2. /api/auth/shopify?shop=... → redirige a https://{shop}/admin/oauth/authorize
 *   3. Shopify vuelve a /api/auth/shopify/callback con ?code&hmac&state&shop
 *   4. Validamos state + HMAC (firma oficial de Shopify)
 *   5. POST a https://{shop}/admin/oauth/access_token con { client_id, client_secret, code }
 *   6. Guardamos { shop, access_token, scope } en cookie httpOnly `shopify_oauth_session`
 *
 * Los access tokens de Shopify no expiran hasta que el merchant desinstale la app.
 *
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
 */

import crypto from "node:crypto";

const DEFAULT_CALLBACK_PATH = "/api/auth/shopify/callback";

export const SHOPIFY_API_VERSION = "2024-10";

export const SHOPIFY_SESSION_COOKIE = "shopify_oauth_session";
export const SHOPIFY_STATE_COOKIE = "shopify_oauth_state";

/** Regex estricta para dominios válidos de Shopify. */
const SHOP_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

export function getAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

export function getShopifyRedirectUri(): string {
  const explicit = process.env.SHOPIFY_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  return `${getAppOrigin()}${DEFAULT_CALLBACK_PATH}`;
}

/** Scope por defecto si no está seteado en env (nivel 2 recomendado de Margify). */
export const SHOPIFY_DEFAULT_SCOPES =
  "read_products,read_orders,read_all_orders,read_customers,read_inventory," +
  "read_analytics,read_reports,read_price_rules,read_discounts," +
  "read_marketing_events,read_locations";

export function getShopifyScopes(): string {
  return (process.env.SHOPIFY_SCOPES?.trim() || SHOPIFY_DEFAULT_SCOPES)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
}

/**
 * Valida que el shop sea un `.myshopify.com` legítimo para evitar open-redirect
 * hacia dominios atacantes.
 */
export function isValidShopDomain(shop: string | null | undefined): shop is string {
  if (!shop) return false;
  const lower = shop.trim().toLowerCase();
  return SHOP_DOMAIN_REGEX.test(lower);
}

/**
 * Verifica el HMAC que Shopify adjunta al callback.
 * Reglas oficiales:
 *   - Excluir `hmac` (y `signature` si viene) del querystring
 *   - Ordenar los parámetros restantes alfabéticamente
 *   - Juntar como key=value separados por `&` (sin URL encoding extra)
 *   - HMAC-SHA256 con el client_secret → comparar en hex, timing-safe.
 *
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant#step-6-verify-the-request-to-the-redirection-url
 */
export function verifyShopifyHmac(
  searchParams: URLSearchParams,
  secret: string
): boolean {
  const receivedHmac = searchParams.get("hmac");
  if (!receivedHmac) return false;

  const entries: [string, string][] = [];
  searchParams.forEach((value, key) => {
    if (key === "hmac" || key === "signature") return;
    entries.push([key, value]);
  });
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const message = entries.map(([k, v]) => `${k}=${v}`).join("&");

  const computed = crypto
    .createHmac("sha256", secret)
    .update(message, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(receivedHmac, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type ShopifySession = {
  shop: string;
  accessToken: string;
  scope: string;
  installedAt: number;
  lastSyncedAt?: number | null;
};

export function parseShopifySession(
  raw: string | undefined | null
): ShopifySession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<ShopifySession>;
    if (!s.shop || !s.accessToken || !isValidShopDomain(s.shop)) return null;
    return {
      shop: s.shop,
      accessToken: s.accessToken,
      scope: s.scope ?? "",
      installedAt: s.installedAt ?? Date.now(),
      lastSyncedAt: s.lastSyncedAt ?? null,
    };
  } catch {
    return null;
  }
}

export function serializeShopifySession(session: ShopifySession): string {
  return JSON.stringify(session);
}

/** Estado temporal guardado en cookie durante el flujo OAuth. */
export type ShopifyStateCookie = {
  state: string;
  shop: string;
  /** Path relativo permitido post-OAuth (ej. /onboarding). */
  returnTo?: string;
};

const ALLOWED_SHOPIFY_OAUTH_RETURN_PATHS = new Set(["/onboarding", "/dashboard/configuracion"]);

export function sanitizeShopifyOAuthReturnTo(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/dashboard/configuracion";
  const path = raw.split("?")[0].trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard/configuracion";
  if (ALLOWED_SHOPIFY_OAUTH_RETURN_PATHS.has(path)) {
    return path;
  }
  return "/dashboard/configuracion";
}

export function parseShopifyState(
  raw: string | undefined | null
): ShopifyStateCookie | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<ShopifyStateCookie>;
    if (!s.state || !s.shop) return null;
    const returnTo = sanitizeShopifyOAuthReturnTo(s.returnTo);
    return { state: s.state, shop: s.shop, returnTo };
  } catch {
    return null;
  }
}

export function shopifyAdminGraphqlUrl(shop: string): string {
  return `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

export type ShopifyProduct = {
  id: string;
  title: string;
  vendor: string | null;
  status: string;
  totalInventory: number;
  priceMin: number;
  priceMax: number;
  currency: string | null;
};

export type ShopifyOrderLineItem = {
  title: string;
  quantity: number;
};

export type ShopifyOrder = {
  id: string;
  name: string;
  createdAt: string;
  customerEmail: string | null;
  itemsCount: number;
  subtotal: number;
  total: number;
  currency: string | null;
  lineItems: ShopifyOrderLineItem[];
};

export type ShopifyMetrics = {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  topProducts: Array<{ title: string; quantity: number }>;
  ordersByDay: Array<{ date: string; revenue: number; orders: number }>;
};
