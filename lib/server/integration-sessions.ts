import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { GOOGLE_ADS_COOKIE, parseGoogleAdsSession } from "@/lib/google-ads";
import { META_COOKIE, parseMetaSession } from "@/lib/meta-auth";
import { ML_TOKEN_COOKIE, parseMlSession } from "@/lib/mercadolibre-auth";
import { getUserIntegration } from "@/lib/server/user-integrations";
import {
  SHOPIFY_SESSION_COOKIE,
  parseShopifySession,
} from "@/lib/shopify-auth";
import { TN_SESSION_COOKIE, parseTiendanubeSession } from "@/lib/tiendanube-auth";

function payloadToJson(payload: Record<string, unknown> | null): string | undefined {
  if (!payload) return undefined;
  try {
    return JSON.stringify(payload);
  } catch {
    return undefined;
  }
}

async function resolve<T>(
  userId: string,
  provider: Parameters<typeof getUserIntegration>[1],
  cookieStore: ReadonlyRequestCookies,
  cookieName: string,
  parse: (raw: string | undefined | null) => T | null
): Promise<T | null> {
  const fromDb = await getUserIntegration(userId, provider);
  const dbRaw = payloadToJson(fromDb);
  if (dbRaw) {
    const parsed = parse(dbRaw);
    if (parsed) return parsed;
  }
  return parse(cookieStore.get(cookieName)?.value);
}

export async function resolveShopifySession(
  userId: string,
  cookieStore: ReadonlyRequestCookies
) {
  return resolve(userId, "shopify", cookieStore, SHOPIFY_SESSION_COOKIE, parseShopifySession);
}

export async function resolveTiendanubeSession(
  userId: string,
  cookieStore: ReadonlyRequestCookies
) {
  return resolve(userId, "tiendanube", cookieStore, TN_SESSION_COOKIE, parseTiendanubeSession);
}

export async function resolveMetaSession(userId: string, cookieStore: ReadonlyRequestCookies) {
  return resolve(userId, "meta", cookieStore, META_COOKIE, parseMetaSession);
}

export async function resolveGoogleAdsSession(
  userId: string,
  cookieStore: ReadonlyRequestCookies
) {
  return resolve(userId, "google_ads", cookieStore, GOOGLE_ADS_COOKIE, parseGoogleAdsSession);
}

export async function resolveMlSession(userId: string, cookieStore: ReadonlyRequestCookies) {
  return resolve(userId, "mercadolibre", cookieStore, ML_TOKEN_COOKIE, parseMlSession);
}
