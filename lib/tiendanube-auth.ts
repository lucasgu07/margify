/**
 * OAuth + API REST de TiendaNube (Nuvemshop).
 *
 * Header de auth: `Authentication: bearer {token}` (no `Authorization`).
 * User-Agent obligatorio en todas las llamadas a api.tiendanube.com.
 *
 * @see https://tiendanube.github.io/api-documentation/authentication
 */

import crypto from "node:crypto";

const DEFAULT_CALLBACK_PATH = "/api/auth/tiendanube/callback";

export const TN_SESSION_COOKIE = "tn_oauth_session";
export const TN_STATE_COOKIE = "tn_oauth_state";

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

export function getTiendanubeRedirectUri(): string {
  const explicit = process.env.TIENDANUBE_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  return `${getAppOrigin()}${DEFAULT_CALLBACK_PATH}`;
}

/**
 * Valida el HMAC del callback OAuth (misma lógica que Shopify: excluir `hmac`,
 * ordenar alfabético, key=value&..., HMAC-SHA256 hex, timing-safe).
 */
export function verifyTiendanubeHmac(
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

export function getTiendanubeUserAgent(): string {
  const ua = process.env.TIENDANUBE_USER_AGENT?.trim();
  if (ua) return ua;
  return "Margify (contacto@margify.app)";
}

export type TiendanubeSession = {
  storeId: string;
  accessToken: string;
  scope: string;
  installedAt: number;
  lastSyncedAt?: number | null;
  storeName?: string | null;
  storeUrl?: string | null;
  currency?: string | null;
};

export function parseTiendanubeSession(
  raw: string | undefined | null
): TiendanubeSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<TiendanubeSession>;
    if (!s.storeId || !s.accessToken) return null;
    return {
      storeId: String(s.storeId),
      accessToken: s.accessToken,
      scope: s.scope ?? "",
      installedAt: s.installedAt ?? Date.now(),
      lastSyncedAt: s.lastSyncedAt ?? null,
      storeName: s.storeName ?? null,
      storeUrl: s.storeUrl ?? null,
      currency: s.currency ?? null,
    };
  } catch {
    return null;
  }
}

export function serializeTiendanubeSession(session: TiendanubeSession): string {
  return JSON.stringify(session);
}

export function tiendanubeApiBase(storeId: string): string {
  return `https://api.tiendanube.com/v1/${storeId}`;
}

export async function tiendanubeFetch(
  session: TiendanubeSession,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const base = tiendanubeApiBase(session.storeId);
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${p}`;
  const headers = new Headers(init?.headers);
  headers.set("Authentication", `bearer ${session.accessToken}`);
  headers.set("User-Agent", getTiendanubeUserAgent());
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return fetch(url, { ...init, headers, cache: "no-store" });
}

/** Paginación vía header `Link` (rel="next"). */
export function parseLinkNextUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    const m = part.match(/<([^>]+)>\s*;\s*rel="next"/i);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * GET a una URL absoluta de la API (siguiente página del header Link).
 * Solo permite host oficial de TiendaNube/Nuvemshop.
 */
export async function tiendanubeFetchUrl(
  session: TiendanubeSession,
  absoluteUrl: string
): Promise<Response> {
  let u: URL;
  try {
    u = new URL(absoluteUrl);
  } catch {
    throw new Error("invalid_url");
  }
  const host = u.hostname.toLowerCase();
  if (!host.includes("tiendanube") && !host.includes("nuvemshop")) {
    throw new Error("invalid_api_host");
  }
  const headers = new Headers();
  headers.set("Authentication", `bearer ${session.accessToken}`);
  headers.set("User-Agent", getTiendanubeUserAgent());
  headers.set("Accept", "application/json");
  return fetch(absoluteUrl, { headers, cache: "no-store" });
}

/** Nombres/descripciones multi-idioma de TiendaNube → un string legible. */
export function normalizeTnText(
  value:
    | string
    | { es?: string; pt?: string; en?: string }
    | Record<string, string | undefined>
    | null
    | undefined
): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  const es = value.es?.trim();
  const pt = value.pt?.trim();
  const en = value.en?.trim();
  if (es || pt || en) return es || pt || en || "";
  for (const v of Object.values(value)) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export type TiendanubeProduct = {
  id: string;
  title: string;
  brand: string | null;
  published: boolean;
  totalInventory: number;
  priceMin: number;
  priceMax: number;
  currency: string | null;
};

export type TiendanubeOrderLineItem = {
  title: string;
  quantity: number;
};

export type TiendanubeOrder = {
  id: string;
  name: string;
  createdAt: string;
  customerEmail: string | null;
  itemsCount: number;
  subtotal: number;
  total: number;
  currency: string | null;
  lineItems: TiendanubeOrderLineItem[];
  status: string;
};

export type TiendanubeMetrics = {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  topProducts: Array<{ title: string; quantity: number }>;
  ordersByDay: Array<{ date: string; revenue: number; orders: number }>;
};

/** Verifica firma de webhooks: HMAC-SHA256 del body raw con el client secret (hex). */
export function verifyTiendanubeWebhookHmac(
  rawBody: string | Buffer,
  hmacHeader: string | null | undefined,
  secret: string
): boolean {
  if (!hmacHeader) return false;
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const computed = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("hex");
  const received = hmacHeader.trim().toLowerCase();
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(received, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
