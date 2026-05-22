import {
  META_GRAPH_BASE,
  normalizeMetaStatus,
  type MetaCampaignRow,
  type MetaSession,
} from "@/lib/meta-auth";

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
  account_currency?: string;
};

type Paged<T> = { data?: T[]; paging?: { next?: string } };

const CONVERSION_ACTIONS = new Set([
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

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

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

export async function fetchMetaCampaigns(
  session: MetaSession,
  adAccountId?: string | null
): Promise<{ ok: true; rows: MetaCampaignRow[] } | { ok: false; error: string }> {
  let accountId = adAccountId || session.ad_account_id || null;
  if (accountId && !accountId.startsWith("act_")) {
    accountId = `act_${accountId.replace(/^act_/, "")}`;
  }
  if (!accountId) {
    return { ok: false, error: "no_ad_account" };
  }

  const token = encodeURIComponent(session.access_token);
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
    "account_currency",
  ].join(",");

  try {
    const campaignsUrl =
      `${META_GRAPH_BASE}/${accountId}/campaigns` +
      `?fields=${campaignFields}&limit=200&access_token=${token}`;
    const insightsUrl =
      `${META_GRAPH_BASE}/${accountId}/insights` +
      `?level=campaign&date_preset=last_30d&limit=200` +
      `&fields=${insightFields}&access_token=${token}`;

    const [campaigns, insights] = await Promise.all([
      fetchAllPages<CampaignRaw>(campaignsUrl),
      fetchAllPages<InsightRaw>(insightsUrl),
    ]);

    const insightsById = new Map<string, InsightRaw>();
    for (const i of insights) insightsById.set(i.campaign_id, i);

    const seenIds = new Set<string>();
    const rows: MetaCampaignRow[] = [];

    for (const c of campaigns) {
      seenIds.add(c.id);
      const ins = insightsById.get(c.id);
      const spend = toNumber(ins?.spend);
      const conversions = sumActions(ins?.actions, (t) => CONVERSION_ACTIONS.has(t));
      const purchases = sumActions(ins?.actions, (t) => /purchase$/.test(t));
      const conversion_value = sumActions(ins?.action_values, (t) => CONVERSION_ACTIONS.has(t));
      rows.push({
        id: c.id,
        name: c.name || "(sin nombre)",
        status: normalizeMetaStatus(c.effective_status || c.status),
        objective: c.objective ?? null,
        currency:
          ins?.account_currency ??
          session.ad_accounts?.find((a) => a.id === accountId)?.currency ??
          null,
        spend,
        impressions: toNumber(ins?.impressions),
        clicks: toNumber(ins?.clicks),
        ctr: toNumber(ins?.ctr),
        cpc: toNumber(ins?.cpc),
        cpm: toNumber(ins?.cpm),
        reach: toNumber(ins?.reach),
        frequency: toNumber(ins?.frequency),
        conversions,
        cost_per_conversion: conversions > 0 ? spend / conversions : 0,
        purchases,
        conversion_value,
        roas: spend > 0 ? conversion_value / spend : 0,
      });
    }

    for (const i of insights) {
      if (seenIds.has(i.campaign_id)) continue;
      const spend = toNumber(i.spend);
      const conversions = sumActions(i.actions, (t) => CONVERSION_ACTIONS.has(t));
      const conversion_value = sumActions(i.action_values, (t) => CONVERSION_ACTIONS.has(t));
      rows.push({
        id: i.campaign_id,
        name: i.campaign_name || "(sin nombre)",
        status: "UNKNOWN",
        objective: null,
        currency: i.account_currency ?? null,
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
        purchases: sumActions(i.actions, (t) => /purchase$/.test(t)),
        conversion_value,
        roas: spend > 0 ? conversion_value / spend : 0,
      });
    }

    rows.sort((a, b) => b.spend - a.spend);
    return { ok: true, rows };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "meta_fetch_failed";
    return { ok: false, error: msg };
  }
}
