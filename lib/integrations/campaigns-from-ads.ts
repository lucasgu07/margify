import type { MetaCampaignRow } from "@/lib/meta-auth";
import type { GoogleAdsCampaignRow } from "@/lib/google-ads";
import type { AdsPlatformScope, Campaign } from "@/types";

const DEFAULT_STORE = "store-ads-all";

function metaStatusToCampaign(s: MetaCampaignRow["status"]): Campaign["status"] {
  return s === "ACTIVE" ? "active" : "paused";
}

function googleStatusToCampaign(s: GoogleAdsCampaignRow["status"]): Campaign["status"] {
  return s === "ENABLED" ? "active" : "paused";
}

export function metaRowsToCampaigns(rows: MetaCampaignRow[], storeId = DEFAULT_STORE): Campaign[] {
  const today = new Date().toISOString().slice(0, 10);
  return rows.map((r) => {
    const attributed = r.conversion_value;
    return {
      id: `meta-${r.id}`,
      store_id: storeId,
      platform: "meta",
      campaign_name: r.name,
      spend: r.spend,
      attributed_revenue: attributed,
      roas_platform: r.roas,
      roas_real: r.spend > 0 ? attributed / r.spend : 0,
      status: metaStatusToCampaign(r.status),
      date: today,
      conversions: r.conversions,
    };
  });
}

export function googleRowsToCampaigns(
  rows: GoogleAdsCampaignRow[],
  storeId = DEFAULT_STORE
): Campaign[] {
  const today = new Date().toISOString().slice(0, 10);
  return rows.map((r) => {
    const spend = r.cost;
    const attributed = spend * (r.conversions > 0 ? 1 : 0);
    return {
      id: `google-${r.id}`,
      store_id: storeId,
      platform: "google",
      campaign_name: r.name,
      spend,
      attributed_revenue: attributed,
      roas_platform: spend > 0 && r.conversions > 0 ? attributed / spend : 0,
      roas_real: spend > 0 && r.conversions > 0 ? attributed / spend : 0,
      status: googleStatusToCampaign(r.status),
      date: today,
      conversions: Math.round(r.conversions),
    };
  });
}

export function filterCampaignsByAdsPlatform(
  campaigns: Campaign[],
  platform: AdsPlatformScope
): Campaign[] {
  return campaigns.filter((c) => c.platform === platform);
}
