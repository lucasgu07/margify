/**
 * Helpers OAuth + Graph API de Meta (Facebook / Instagram Ads).
 *
 * Flujo:
 *   1. /api/auth/meta redirige a https://www.facebook.com/{v}/dialog/oauth
 *   2. Meta vuelve a /api/auth/meta/callback con `code`
 *   3. Intercambiamos `code` por access_token corto (1-2 h)
 *   4. Intercambiamos short-lived por long-lived token (~60 días)
 *   5. Guardamos todo en cookie httpOnly `meta_oauth_session`
 *
 * Nota: `ads_read` está sujeto a App Review en Meta. Hasta que pases el review
 * solo funciona para vos (admin de la app) y usuarios agregados como developers
 * o testers en developers.facebook.com.
 */

const DEFAULT_CALLBACK_PATH = "/api/auth/meta/callback";

export const META_GRAPH_VERSION = "v21.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
export const META_OAUTH_DIALOG = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`;
export const META_OAUTH_TOKEN = `${META_GRAPH_BASE}/oauth/access_token`;

/** Permisos mínimos para leer Marketing API. */
export const META_SCOPE = "ads_read,business_management";

export const META_COOKIE = "meta_oauth_session";
export const META_STATE_COOKIE = "meta_oauth_state";

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

export function getMetaRedirectUri(): string {
  const explicit = process.env.META_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  return `${getAppOrigin()}${DEFAULT_CALLBACK_PATH}`;
}

export type MetaAdAccount = {
  id: string;
  account_id: string;
  name: string;
  currency: string | null;
};

export type MetaSession = {
  access_token: string;
  token_type?: string | null;
  expires_in?: number | null;
  obtained_at?: number;
  user_id?: string | null;
  user_name?: string | null;
  ad_account_id?: string | null;
  ad_accounts?: MetaAdAccount[];
  last_synced_at?: number | null;
};

export function parseMetaSession(raw: string | undefined | null): MetaSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as MetaSession;
    if (!s.access_token) return null;
    return s;
  } catch {
    return null;
  }
}

export type MetaCampaignStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DELETED"
  | "ARCHIVED"
  | "IN_PROCESS"
  | "WITH_ISSUES"
  | "UNKNOWN";

export function normalizeMetaStatus(s: string | null | undefined): MetaCampaignStatus {
  const u = String(s ?? "").toUpperCase();
  if (u === "ACTIVE") return "ACTIVE";
  if (u === "PAUSED") return "PAUSED";
  if (u === "DELETED") return "DELETED";
  if (u === "ARCHIVED") return "ARCHIVED";
  if (u === "IN_PROCESS") return "IN_PROCESS";
  if (u === "WITH_ISSUES") return "WITH_ISSUES";
  return "UNKNOWN";
}

export function metaStatusBadgeTone(status: MetaCampaignStatus):
  | "success"
  | "warning"
  | "danger"
  | "neutral" {
  if (status === "ACTIVE") return "success";
  if (status === "PAUSED") return "warning";
  if (status === "DELETED" || status === "ARCHIVED") return "danger";
  return "neutral";
}

export function metaStatusLabel(status: MetaCampaignStatus): string {
  if (status === "ACTIVE") return "Activa";
  if (status === "PAUSED") return "Pausada";
  if (status === "DELETED") return "Eliminada";
  if (status === "ARCHIVED") return "Archivada";
  if (status === "IN_PROCESS") return "En revisión";
  if (status === "WITH_ISSUES") return "Con problemas";
  return "Desconocida";
}

/** Fila unificada que consume la tabla de campañas de Meta en /dashboard/campanas. */
export type MetaCampaignRow = {
  id: string;
  name: string;
  status: MetaCampaignStatus;
  objective: string | null;
  currency: string | null;
  /** Gasto del período (moneda de la cuenta) */
  spend: number;
  impressions: number;
  clicks: number;
  /** CTR en porcentaje (ya multiplicado por 100) */
  ctr: number;
  /** CPC en moneda de la cuenta */
  cpc: number;
  /** CPM en moneda de la cuenta */
  cpm: number;
  reach: number;
  frequency: number;
  /** Suma de acciones "estándar" (purchases, leads, complete_registration, etc.) */
  conversions: number;
  /** Costo promedio por conversión (spend / conversions si no viene) */
  cost_per_conversion: number;
  /** Compras específicamente (action_type=purchase) si existen */
  purchases: number;
  /** Valor generado por conversiones (action_values, p.ej. purchase) */
  conversion_value: number;
  /** ROAS = conversion_value / spend */
  roas: number;
};
