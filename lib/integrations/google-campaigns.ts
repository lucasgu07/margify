import { GoogleAdsApi } from "google-ads-api";
import {
  fromMicros,
  mapCampaignStatus,
  normalizeCustomerId,
  type GoogleAdsCampaignRow,
  type GoogleAdsSession,
} from "@/lib/google-ads";

type RawRow = {
  campaign?: {
    id?: string | number | null;
    name?: string | null;
    status?: number | string | null;
    advertising_channel_type?: number | string | null;
  };
  metrics?: {
    impressions?: number | string | null;
    clicks?: number | string | null;
    cost_micros?: number | string | null;
    conversions?: number | string | null;
    cost_per_conversion?: number | string | null;
    ctr?: number | string | null;
    average_cpc?: number | string | null;
  };
};

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function mapRows(rows: RawRow[]): GoogleAdsCampaignRow[] {
  return rows.map((r) => ({
    id: String(r.campaign?.id ?? ""),
    name: r.campaign?.name ?? "(sin nombre)",
    status: mapCampaignStatus(r.campaign?.status),
    advertising_channel_type: String(r.campaign?.advertising_channel_type ?? ""),
    impressions: toNumber(r.metrics?.impressions),
    clicks: toNumber(r.metrics?.clicks),
    cost: fromMicros(r.metrics?.cost_micros),
    conversions: toNumber(r.metrics?.conversions),
    cost_per_conversion: fromMicros(r.metrics?.cost_per_conversion),
    ctr: toNumber(r.metrics?.ctr),
    average_cpc: fromMicros(r.metrics?.average_cpc),
  }));
}

export async function fetchGoogleCampaigns(
  session: GoogleAdsSession
): Promise<{ ok: true; rows: GoogleAdsCampaignRow[] } | { ok: false; error: string }> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  const refreshToken = session.refresh_token;
  const customerId =
    normalizeCustomerId(session.customer_id) ||
    normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const loginCustomerId =
    normalizeCustomerId(session.login_customer_id) ||
    normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);

  if (!clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
    return { ok: false, error: "not_configured" };
  }

  try {
    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      ...(loginCustomerId ? { login_customer_id: loginCustomerId } : {}),
    });

    const rows = await customer.query<RawRow[]>(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.cost_micros DESC
    `);

    return { ok: true, rows: mapRows(rows) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "google_fetch_failed";
    return { ok: false, error: msg };
  }
}
