import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  META_COOKIE,
  META_GRAPH_BASE,
  normalizeMetaStatus,
  parseMetaSession,
  type MetaCampaignRow,
  type MetaSession,
} from "@/lib/meta-auth";

export const runtime = "nodejs";

type Body = { adAccountId?: string };

type CampaignRaw = {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
  objective?: string;
};

type InsightAction = { action_type: string; value: string };

type InsightRaw = {
  campaign_id: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: InsightAction[];
  action_values?: InsightAction[];
  cost_per_action_type?: InsightAction[];
  account_currency?: string;
};

type Paged<T> = { data?: T[]; paging?: { next?: string } };

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

/** Acciones que contabilizamos como "conversiones" (suma). */
const CONVERSION_ACTIONS = new Set<string>([
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
  "omni_purchase",
  "onsite_web_purchase",
  "onsite_conversion.purchase",
  "lead",
  "offsite_conversion.fb_pixel_lead",
  "complete_registration",
  "offsite_conversion.fb_pixel_complete_registration",
  "onsite_conversion.lead_grouped",
]);

function sumActions(actions: InsightAction[] | undefined, filter: (t: string) => boolean): number {
  if (!actions) return 0;
  return actions.reduce((acc, a) => (filter(a.action_type) ? acc + toNumber(a.value) : acc), 0);
}

async function fetchAllPages<T>(firstUrl: string): Promise<T[]> {
  const all: T[] = [];
  let next: string | undefined = firstUrl;
  let guard = 0;
  while (next && guard < 20) {
    const res = await fetch(next);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message: string } };
      throw new Error(body.error?.message || `HTTP ${res.status}`);
    }
    const json = (await res.json()) as Paged<T>;
    if (json.data) all.push(...json.data);
    next = json.paging?.next;
    guard += 1;
  }
  return all;
}

/**
 * Sincroniza campañas de Meta (últimos 30 días) cruzando:
 *   - /{ad_account}/campaigns → status y objetivo
 *   - /{ad_account}/insights?level=campaign&date_preset=last_30d → métricas
 *
 * POST /api/meta-ads/sync
 * Body: { adAccountId?: string }  — si el usuario elige otra cuenta.
 */
export async function POST(request: Request) {
  const cookieStore = cookies();
  const session = parseMetaSession(cookieStore.get(META_COOKIE)?.value);
  if (!session) {
    return NextResponse.json(
      { error: "Cuenta no conectada. Conectá Meta Ads desde Configuración." },
      { status: 401 }
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  let adAccountId = body.adAccountId || session.ad_account_id || null;
  if (adAccountId && !adAccountId.startsWith("act_")) {
    adAccountId = `act_${adAccountId.replace(/^act_/, "")}`;
  }
  if (!adAccountId) {
    return NextResponse.json(
      { error: "No encontramos ninguna cuenta publicitaria para consultar." },
      { status: 400 }
    );
  }

  const token = encodeURIComponent(session.access_token);

  try {
    const campaignFields = "id,name,status,effective_status,objective";
    const insightFields = [
      "campaign_id",
      "campaign_name",
      "spend",
      "impressions",
      "clicks",
      "ctr",
      "cpc",
      "cpm",
      "reach",
      "frequency",
      "actions",
      "action_values",
      "cost_per_action_type",
      "account_currency",
    ].join(",");

    const campaignsUrl =
      `${META_GRAPH_BASE}/${adAccountId}/campaigns` +
      `?fields=${campaignFields}&limit=200&access_token=${token}`;
    const insightsUrl =
      `${META_GRAPH_BASE}/${adAccountId}/insights` +
      `?level=campaign&date_preset=last_30d&limit=200` +
      `&fields=${insightFields}&access_token=${token}`;

    const [campaigns, insights] = await Promise.all([
      fetchAllPages<CampaignRaw>(campaignsUrl),
      fetchAllPages<InsightRaw>(insightsUrl),
    ]);

    const insightsById = new Map<string, InsightRaw>();
    for (const i of insights) insightsById.set(i.campaign_id, i);

    const currency =
      insights.find((i) => i.account_currency)?.account_currency ??
      session.ad_accounts?.find((a) => a.id === adAccountId)?.currency ??
      null;

    const seenIds = new Set<string>();
    const rows: MetaCampaignRow[] = [];

    for (const c of campaigns) {
      seenIds.add(c.id);
      const ins = insightsById.get(c.id);
      const spend = toNumber(ins?.spend);
      const conversions = sumActions(ins?.actions, (t) => CONVERSION_ACTIONS.has(t));
      const purchases = sumActions(ins?.actions, (t) => /purchase$/.test(t));
      const conversion_value = sumActions(ins?.action_values, (t) => CONVERSION_ACTIONS.has(t));
      const cost_per_conversion = conversions > 0 ? spend / conversions : 0;
      const status = normalizeMetaStatus(c.effective_status || c.status);
      const ctrRaw = toNumber(ins?.ctr);

      rows.push({
        id: c.id,
        name: c.name || "(sin nombre)",
        status,
        objective: c.objective ?? null,
        currency,
        spend,
        impressions: toNumber(ins?.impressions),
        clicks: toNumber(ins?.clicks),
        ctr: ctrRaw,
        cpc: toNumber(ins?.cpc),
        cpm: toNumber(ins?.cpm),
        reach: toNumber(ins?.reach),
        frequency: toNumber(ins?.frequency),
        conversions,
        cost_per_conversion,
        purchases,
        conversion_value,
        roas: spend > 0 ? conversion_value / spend : 0,
      });
    }

    for (const i of insights) {
      if (seenIds.has(i.campaign_id)) continue;
      const spend = toNumber(i.spend);
      const conversions = sumActions(i.actions, (t) => CONVERSION_ACTIONS.has(t));
      const purchases = sumActions(i.actions, (t) => /purchase$/.test(t));
      const conversion_value = sumActions(i.action_values, (t) => CONVERSION_ACTIONS.has(t));
      rows.push({
        id: i.campaign_id,
        name: i.campaign_name || "(sin nombre)",
        status: "UNKNOWN",
        objective: null,
        currency,
        spend,
        impressions: toNumber(i.impressions),
        clicks: toNumber(i.clicks),
        ctr: toNumber(i.ctr),
        cpc: toNumber(i.cpc),
        cpm: toNumber(i.cpm),
        reach: toNumber(i.reach),
        frequency: toNumber(i.frequency),
        conversions,
        cost_per_conversion: conversions > 0 ? spend / conversions : 0,
        purchases,
        conversion_value,
        roas: spend > 0 ? conversion_value / spend : 0,
      });
    }

    rows.sort((a, b) => b.spend - a.spend);

    const now = Date.now();
    const updated: MetaSession = {
      ...session,
      ad_account_id: adAccountId,
      last_synced_at: now,
    };
    cookieStore.set(META_COOKIE, JSON.stringify(updated), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 55,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({
      ok: true,
      adAccountId,
      currency,
      syncedAt: now,
      count: rows.length,
      campaigns: rows,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    const isAuth = /expired|invalid|oauth|session|access token|permission/i.test(msg);
    return NextResponse.json(
      {
        error: isAuth
          ? "La sesión con Meta venció o no tiene permisos. Reconectá tu cuenta."
          : `No se pudieron traer campañas de Meta: ${msg}`,
      },
      { status: isAuth ? 401 : 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
