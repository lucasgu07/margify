/**
 * URLs base de OAuth de Mercado Libre (Argentina; configurable con MERCADOLIBRE_AUTH_BASE).
 * @see https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion
 */

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

export function getMercadoLibreRedirectUri(): string {
  return `${getAppOrigin()}/api/auth/mercadolibre/callback`;
}

/** País/sitio de autorización (por defecto Argentina). */
export function getMercadoLibreAuthBase(): string {
  return process.env.MERCADOLIBRE_AUTH_BASE?.trim() || "https://auth.mercadolibre.com.ar";
}

export const ML_TOKEN_COOKIE = "ml_oauth_session";
export const ML_STATE_COOKIE = "ml_oauth_state";

export type MlSession = {
  access_token: string;
  refresh_token?: string | null;
  user_id?: number | null;
  expires_in?: number | null;
  obtained_at?: number;
};

export function parseMlSession(raw: string | undefined | null): MlSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as MlSession;
    if (!s.access_token) return null;
    return s;
  } catch {
    return null;
  }
}
