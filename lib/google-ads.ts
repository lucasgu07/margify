/**
 * Helpers de OAuth + Google Ads API.
 *
 * Origen público: `NEXT_PUBLIC_SITE_URL` → `VERCEL_URL` → `http://localhost:3000`.
 *
 * Si está definida `GOOGLE_ADS_REDIRECT_URI` en el entorno (caso típico de dev con
 * `http://localhost:3000/api/auth/google/callback`) la usamos tal cual para que
 * coincida con lo que hay cargado en Google Cloud Console.
 */

const DEFAULT_CALLBACK_PATH = "/api/auth/google/callback";

export const GOOGLE_ADS_COOKIE = "ga_oauth_session";
export const GOOGLE_ADS_STATE_COOKIE = "ga_oauth_state";

export const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

export const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

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

export function getGoogleAdsRedirectUri(): string {
  const explicit = process.env.GOOGLE_ADS_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  return `${getAppOrigin()}${DEFAULT_CALLBACK_PATH}`;
}

export type GoogleAdsSession = {
  access_token: string;
  refresh_token?: string | null;
  expires_in?: number | null;
  obtained_at?: number;
  customer_id?: string | null;
  login_customer_id?: string | null;
  last_synced_at?: number | null;
};

export function parseGoogleAdsSession(raw: string | undefined | null): GoogleAdsSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as GoogleAdsSession;
    if (!s.refresh_token && !s.access_token) return null;
    return s;
  } catch {
    return null;
  }
}

/** Convierte `cost_micros` y similares a unidades de moneda (USD / ARS según la cuenta). */
export function fromMicros(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n / 1_000_000;
}

/** Normaliza un customer_id eliminando guiones y espacios: "123-456-7890" → "1234567890" */
export function normalizeCustomerId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).replace(/[^0-9]/g, "");
  return s.length >= 8 ? s : null;
}

export type GoogleAdsCampaignRow = {
  id: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED" | "UNKNOWN";
  advertising_channel_type: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  cost_per_conversion: number;
  ctr: number;
  average_cpc: number;
};

export function mapCampaignStatus(status: number | string | null | undefined): GoogleAdsCampaignRow["status"] {
  const s = String(status ?? "").toUpperCase();
  if (s === "2" || s === "ENABLED") return "ENABLED";
  if (s === "3" || s === "PAUSED") return "PAUSED";
  if (s === "4" || s === "REMOVED") return "REMOVED";
  return "UNKNOWN";
}

/** Badge de color por estado (sistema de diseño Margify). */
export function statusBadgeTone(status: GoogleAdsCampaignRow["status"]):
  | "success"
  | "warning"
  | "danger"
  | "neutral" {
  if (status === "ENABLED") return "success";
  if (status === "PAUSED") return "warning";
  if (status === "REMOVED") return "danger";
  return "neutral";
}
