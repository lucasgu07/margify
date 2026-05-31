import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { GOOGLE_ADS_COOKIE, parseGoogleAdsSession, type GoogleAdsSession } from "@/lib/google-ads";
import { META_COOKIE, parseMetaSession, type MetaSession } from "@/lib/meta-auth";
import { ML_TOKEN_COOKIE, parseMlSession, type MlSession } from "@/lib/mercadolibre-auth";
import {
  SHOPIFY_SESSION_COOKIE,
  parseShopifySession,
  type ShopifySession,
} from "@/lib/shopify-auth";
import {
  TN_SESSION_COOKIE,
  parseTiendanubeSession,
  type TiendanubeSession,
} from "@/lib/tiendanube-auth";
import { TIKTOK_COOKIE, parseTikTokSession, type TikTokSession } from "@/lib/tiktok-auth";
import { getUserIntegration } from "@/lib/server/user-integrations";

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
): Promise<ShopifySession | null> {
  return resolve<ShopifySession>(userId, "shopify", cookieStore, SHOPIFY_SESSION_COOKIE, parseShopifySession);
}

export async function resolveTiendanubeSession(
  userId: string,
  cookieStore: ReadonlyRequestCookies
): Promise<TiendanubeSession | null> {
  return resolve<TiendanubeSession>(userId, "tiendanube", cookieStore, TN_SESSION_COOKIE, parseTiendanubeSession);
}

export async function resolveMetaSession(userId: string, cookieStore: ReadonlyRequestCookies): Promise<MetaSession | null> {
  return resolve<MetaSession>(userId, "meta", cookieStore, META_COOKIE, parseMetaSession);
}

export async function resolveGoogleAdsSession(
  userId: string,
  cookieStore: ReadonlyRequestCookies
): Promise<GoogleAdsSession | null> {
  return resolve<GoogleAdsSession>(userId, "google_ads", cookieStore, GOOGLE_ADS_COOKIE, parseGoogleAdsSession);
}

export async function resolveMlSession(userId: string, cookieStore: ReadonlyRequestCookies): Promise<MlSession | null> {
  return resolve<MlSession>(userId, "mercadolibre", cookieStore, ML_TOKEN_COOKIE, parseMlSession);
}

export async function resolveTikTokSession(userId: string, cookieStore: ReadonlyRequestCookies): Promise<TikTokSession | null> {
  return resolve<TikTokSession>(userId, "tiktok", cookieStore, TIKTOK_COOKIE, parseTikTokSession);
}
