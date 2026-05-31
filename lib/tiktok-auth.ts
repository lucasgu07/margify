/** TikTok Marketing API OAuth + sesión. */

export const TIKTOK_COOKIE = "tiktok_oauth_session";
export const TIKTOK_STATE_COOKIE = "tiktok_oauth_state";

export type TikTokSession = {
  access_token: string;
  advertiser_id: string;
  advertiser_ids?: string[];
  obtained_at?: number;
  last_synced_at?: number | null;
};

export function getTikTokRedirectUri(): string {
  const explicit = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : "http://localhost:3000");
  return `${origin}/api/auth/tiktok/callback`;
}

export function getTikTokAuthUrl(state: string): string {
  const appId = process.env.TIKTOK_CLIENT_ID?.trim() || process.env.TIKTOK_APP_ID?.trim();
  if (!appId) throw new Error("missing_tiktok_app_id");
  const redirect = encodeURIComponent(getTikTokRedirectUri());
  return `https://business-api.tiktok.com/portal/auth?app_id=${appId}&redirect_uri=${redirect}&state=${encodeURIComponent(state)}`;
}

export function parseTikTokSession(raw: string | undefined | null): TikTokSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as TikTokSession;
    if (!s.access_token || !s.advertiser_id) return null;
    return s;
  } catch {
    return null;
  }
}

export type TikTokCampaignRow = {
  id: string;
  name: string;
  status: "ENABLE" | "DISABLE" | "UNKNOWN";
  spend: number;
  conversions: number;
  conversion_value: number;
  roas: number;
};

export function tikTokStatusLabel(status: TikTokCampaignRow["status"]): string {
  if (status === "ENABLE") return "Activa";
  if (status === "DISABLE") return "Pausada";
  return "Desconocida";
}
