import type { TikTokCampaignRow, TikTokSession } from "@/lib/tiktok-auth";

const API_BASE = "https://business-api.tiktok.com/open_api/v1.3";

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

type ApiResponse<T> = {
  code?: number;
  message?: string;
  data?: T;
};

type ReportListItem = {
  dimensions?: { campaign_id?: string; campaign_name?: string };
  metrics?: {
    spend?: string;
    conversion?: string;
    total_purchase_value?: string;
    campaign_name?: string;
  };
};

type CampaignListItem = {
  campaign_id?: string;
  campaign_name?: string;
  operation_status?: string;
};

export async function fetchTikTokCampaigns(
  session: TikTokSession,
  days = 30
): Promise<{ ok: true; rows: TikTokCampaignRow[] } | { ok: false; error: string }> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const reportUrl = new URL(`${API_BASE}/report/integrated/get/`);
  reportUrl.searchParams.set("advertiser_id", session.advertiser_id);
  reportUrl.searchParams.set("report_type", "BASIC");
  reportUrl.searchParams.set("data_level", "AUCTION_CAMPAIGN");
  reportUrl.searchParams.set("dimensions", JSON.stringify(["campaign_id"]));
  reportUrl.searchParams.set(
    "metrics",
    JSON.stringify(["spend", "conversion", "total_purchase_value", "campaign_name"])
  );
  reportUrl.searchParams.set("start_date", fmt(start));
  reportUrl.searchParams.set("end_date", fmt(today));
  reportUrl.searchParams.set("page_size", "200");

  const reportRes = await fetch(reportUrl.toString(), {
    headers: { "Access-Token": session.access_token },
    cache: "no-store",
  });

  if (reportRes.status === 401 || reportRes.status === 403) {
    return { ok: false, error: "token_invalid" };
  }

  const reportJson = (await reportRes.json()) as ApiResponse<{ list?: ReportListItem[] }>;
  if (reportJson.code !== 0 && reportJson.code !== undefined) {
    return { ok: false, error: reportJson.message ?? "report_failed" };
  }

  const statusMap = new Map<string, TikTokCampaignRow["status"]>();
  try {
    const campUrl = new URL(`${API_BASE}/campaign/get/`);
    campUrl.searchParams.set("advertiser_id", session.advertiser_id);
    campUrl.searchParams.set("page_size", "200");
    const campRes = await fetch(campUrl.toString(), {
      headers: { "Access-Token": session.access_token },
      cache: "no-store",
    });
    const campJson = (await campRes.json()) as ApiResponse<{ list?: CampaignListItem[] }>;
    for (const c of campJson.data?.list ?? []) {
      if (!c.campaign_id) continue;
      const st = c.operation_status === "ENABLE" ? "ENABLE" : c.operation_status === "DISABLE" ? "DISABLE" : "UNKNOWN";
      statusMap.set(c.campaign_id, st);
    }
  } catch {
    /* status opcional */
  }

  const rows: TikTokCampaignRow[] = (reportJson.data?.list ?? []).map((item) => {
    const id = item.dimensions?.campaign_id ?? "unknown";
    const spend = toNumber(item.metrics?.spend);
    const conversions = toNumber(item.metrics?.conversion);
    const conversion_value = toNumber(item.metrics?.total_purchase_value);
    const name =
      item.metrics?.campaign_name ||
      item.dimensions?.campaign_name ||
      `Campaña ${id}`;
    return {
      id,
      name,
      status: statusMap.get(id) ?? "UNKNOWN",
      spend,
      conversions,
      conversion_value,
      roas: spend > 0 ? conversion_value / spend : 0,
    };
  });

  rows.sort((a, b) => b.spend - a.spend);
  return { ok: true, rows };
}
