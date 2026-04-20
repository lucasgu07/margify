import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleAdsApi } from "google-ads-api";
import {
  GOOGLE_ADS_COOKIE,
  fromMicros,
  mapCampaignStatus,
  normalizeCustomerId,
  parseGoogleAdsSession,
  type GoogleAdsCampaignRow,
} from "@/lib/google-ads";

/** `google-ads-api` corre sobre Node; forzamos runtime Node para evitar el runtime Edge. */
export const runtime = "nodejs";

type Body = { customerId?: string };

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
  return rows.map((r) => {
    const id = String(r.campaign?.id ?? "");
    return {
      id,
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
    };
  });
}

async function loadCampaigns(
  clientId: string,
  clientSecret: string,
  developerToken: string,
  refreshToken: string,
  customerId: string,
  loginCustomerId: string | null
): Promise<GoogleAdsCampaignRow[]> {
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

  return mapRows(rows);
}

/**
 * Sincroniza campañas de Google Ads (últimos 30 días) y actualiza `last_synced_at`
 * dentro de la cookie httpOnly `ga_oauth_session`.
 *
 * POST /api/google-ads/sync
 * Body JSON (opcional): { customerId?: string }  ← si el usuario eligió otra cuenta.
 */
export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();

  if (!clientId || !clientSecret || !developerToken) {
    return NextResponse.json(
      { error: "Faltan credenciales de Google Ads en el servidor." },
      { status: 500 }
    );
  }

  const cookieStore = cookies();
  const session = parseGoogleAdsSession(cookieStore.get(GOOGLE_ADS_COOKIE)?.value);
  if (!session || !session.refresh_token) {
    return NextResponse.json(
      { error: "Cuenta no conectada. Conectá Google Ads desde Configuración." },
      { status: 401 }
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const customerId =
    normalizeCustomerId(body.customerId) ||
    normalizeCustomerId(session.customer_id) ||
    normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID);

  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "No sabemos qué cuenta consultar. Definí GOOGLE_ADS_CUSTOMER_ID o reconectá la cuenta.",
      },
      { status: 400 }
    );
  }

  try {
    const campaigns = await loadCampaigns(
      clientId,
      clientSecret,
      developerToken,
      session.refresh_token,
      customerId,
      session.login_customer_id ?? normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID)
    );

    const now = Date.now();
    const updated = {
      ...session,
      customer_id: customerId,
      last_synced_at: now,
    };
    cookieStore.set(GOOGLE_ADS_COOKIE, JSON.stringify(updated), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({
      ok: true,
      customerId,
      syncedAt: now,
      count: campaigns.length,
      campaigns,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    const isAuth = /invalid_grant|unauthorized|401|authentication/i.test(msg);
    return NextResponse.json(
      {
        error: isAuth
          ? "La sesión con Google venció. Reconectá tu cuenta de Google Ads."
          : `No se pudieron traer campañas: ${msg}`,
      },
      { status: isAuth ? 401 : 500 }
    );
  }
}

/** GET = lo mismo que POST, pensando en pruebas manuales y recargas desde el navegador. */
export async function GET(request: Request) {
  return POST(request);
}
