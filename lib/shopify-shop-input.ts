/**
 * Normalización y validación del dominio shop (cliente).
 * OAuth de Shopify exige el host de admin `*.myshopify.com`; no se agrega sufijo automático.
 */

const SHOP_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

/** Quita protocolo, ruta y puerto; devuelve solo el host en minúsculas. No modifica el sufijo. */
export function stripShopifyShopInput(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const host = withoutProtocol
    .split("/")[0]
    .split("?")[0]
    .replace(/:\d+$/, "");
  return host.replace(/\.+$/, "");
}

export function isValidStrippedShopHost(host: string): boolean {
  return SHOP_DOMAIN_REGEX.test(host);
}

/** Si el valor es válido devuelve null; si no, un mensaje para mostrar al usuario. */
export function shopifyShopInputErrorMessage(raw: string): string | null {
  const host = stripShopifyShopInput(raw);
  if (!host) {
    return "Ingresá el dominio de administración de tu tienda (termina en .myshopify.com).";
  }
  if (isValidStrippedShopHost(host)) return null;
  if (host.includes(".") && !host.endsWith(".myshopify.com")) {
    return "Para conectar Margify usá el dominio del panel de Shopify, el que termina en .myshopify.com (lo ves al abrir Administración o en Ajustes → Dominios).";
  }
  return "Escribí el dominio completo, por ejemplo: mi-tienda.myshopify.com";
}

export function buildShopifyOAuthUrl(shop: string, returnTo?: string): string {
  const params = new URLSearchParams();
  params.set("shop", shop);
  if (returnTo) params.set("return_to", returnTo);
  return `/api/auth/shopify?${params.toString()}`;
}
