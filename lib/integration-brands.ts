import type { AdsPlatformScope, OrderChannel, StorePlatform } from "@/types";

export type IntegrationBrandId =
  | "tiendanube"
  | "shopify"
  | "mercadolibre"
  | "mercadopago"
  | "meta"
  | "googleAds"
  | "tiktok";

/** Orden usado en landing / referencias. */
export const INTEGRATION_BRAND_ORDER: IntegrationBrandId[] = [
  "tiendanube",
  "shopify",
  "mercadolibre",
  "meta",
  "googleAds",
  "tiktok",
];

export const INTEGRATION_DISPLAY_LABEL: Record<IntegrationBrandId, string> = {
  tiendanube: "TiendaNube",
  shopify: "Shopify",
  mercadolibre: "Mercado Libre",
  mercadopago: "Mercado Pago",
  meta: "Meta",
  googleAds: "Google Ads",
  tiktok: "TikTok",
};

export function orderChannelToBrandId(channel: OrderChannel): IntegrationBrandId {
  if (channel === "TiendaNube") return "tiendanube";
  if (channel === "MercadoLibre") return "mercadolibre";
  return "shopify";
}

export function storePlatformToBrandId(platform: StorePlatform): IntegrationBrandId {
  return platform;
}

/** Icono de marca para el selector de plataforma de ads (Campañas). */
export function adsPlatformToBrandId(p: AdsPlatformScope): IntegrationBrandId {
  if (p === "google") return "googleAds";
  return p;
}

/** Nombre corto para columnas ROAS / diferencia vs plataforma. */
export const ADS_PLATFORM_SHORT_LABEL: Record<AdsPlatformScope, string> = {
  meta: "Meta",
  tiktok: "TikTok",
  google: "Google",
};
