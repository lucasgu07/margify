import { cookies } from "next/headers";
import {
  googleRowsToCampaigns,
  metaRowsToCampaigns,
  tikTokRowsToCampaigns,
} from "@/lib/integrations/campaigns-from-ads";
import { fetchGoogleCampaigns } from "@/lib/integrations/google-campaigns";
import { fetchMercadoLibreOrders } from "@/lib/integrations/mercadolibre-orders";
import { fetchMetaCampaigns } from "@/lib/integrations/meta-campaigns";
import { fetchTikTokCampaigns } from "@/lib/integrations/tiktok-campaigns";
import {
  mercadolibreOrdersToMargify,
  shopifyOrdersToMargify,
  tiendanubeOrdersToMargify,
} from "@/lib/integrations/normalize-orders";
import { fetchShopifyOrders } from "@/lib/integrations/shopify-orders";
import { fetchTiendanubeOrders } from "@/lib/integrations/tiendanube-orders";
import {
  resolveGoogleAdsSession,
  resolveMetaSession,
  resolveMlSession,
  resolveShopifySession,
  resolveTiendanubeSession,
  resolveTikTokSession,
} from "@/lib/server/integration-sessions";
import { historyDaysLimit } from "@/lib/plan-features";
import { getAuthUser } from "@/lib/server/auth-user";
import {
  readCostsForUserAsync,
  type CostsConfigInput,
} from "@/lib/server/user-costs";
import type { Campaign, Order, Store, StorePlatform } from "@/types";
import type { Plan } from "@/types";

export type LiveConnectedStore = {
  id: string;
  label: string;
  platform: StorePlatform;
  store_url: string;
};

export type LiveDashboardPayload = {
  orders: Order[];
  campaigns: Campaign[];
  costsConfig: CostsConfigInput;
  connectedStores: LiveConnectedStore[];
  integrations: {
    shopify: boolean;
    tiendanube: boolean;
    mercadolibre: boolean;
    meta: boolean;
    google: boolean;
    tiktok: boolean;
  };
};

function storeLabel(platform: StorePlatform, url: string): string {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(
      /^www\./,
      ""
    );
    const names: Record<StorePlatform, string> = {
      shopify: "Shopify",
      tiendanube: "Tienda Nube",
      mercadolibre: "Mercado Libre",
    };
    return `${names[platform]} (${host})`;
  } catch {
    return platform;
  }
}

/**
 * Agrega pedidos y campañas desde OAuth persistido (Supabase + cookies).
 */
export async function loadLiveDashboardData(userId: string): Promise<LiveDashboardPayload> {
  const cookieStore = cookies();
  const authUser = await getAuthUser();
  const plan: Plan = authUser?.id === userId ? authUser.plan : "starter";
  const historyDays = historyDaysLimit(plan) ?? 90;

  const costsConfig = await readCostsForUserAsync(userId);

  const orders: Order[] = [];
  const connectedStores: LiveConnectedStore[] = [];
  const campaigns: Campaign[] = [];

  const shopifySession = await resolveShopifySession(userId, cookieStore);
  const tnSession = await resolveTiendanubeSession(userId, cookieStore);
  const mlSession = await resolveMlSession(userId, cookieStore);
  const metaSession = await resolveMetaSession(userId, cookieStore);
  const googleSession = await resolveGoogleAdsSession(userId, cookieStore);
  const tiktokSession = await resolveTikTokSession(userId, cookieStore);

  const storeTasks: Promise<void>[] = [];

  if (shopifySession) {
    storeTasks.push(
      (async () => {
        const storeId = `store-shopify-${shopifySession.shop}`;
        const url = `https://${shopifySession.shop}`;
        connectedStores.push({
          id: storeId,
          label: storeLabel("shopify", url),
          platform: "shopify",
          store_url: url,
        });
        const res = await fetchShopifyOrders(shopifySession, historyDays);
        if (res.ok) {
          orders.push(...shopifyOrdersToMargify(res.orders, storeId, costsConfig));
        }
      })()
    );
  }

  if (tnSession) {
    storeTasks.push(
      (async () => {
        const storeId = `store-tn-${tnSession.storeId}`;
        const url =
          tnSession.storeUrl ?? `https://tienda-${tnSession.storeId}.mitiendanube.com`;
        connectedStores.push({
          id: storeId,
          label: storeLabel("tiendanube", url),
          platform: "tiendanube",
          store_url: url,
        });
        const res = await fetchTiendanubeOrders(tnSession);
        if (res.ok) {
          orders.push(...tiendanubeOrdersToMargify(res.orders, storeId, costsConfig));
        }
      })()
    );
  }

  if (mlSession) {
    storeTasks.push(
      (async () => {
        const mlUserId = mlSession.user_id ?? "unknown";
        const storeId = `store-ml-${mlUserId}`;
        const url = `https://www.mercadolibre.com.ar/perfil/${mlUserId}`;
        connectedStores.push({
          id: storeId,
          label: storeLabel("mercadolibre", url),
          platform: "mercadolibre",
          store_url: url,
        });
        const res = await fetchMercadoLibreOrders(mlSession, historyDays);
        if (res.ok) {
          orders.push(...mercadolibreOrdersToMargify(res.orders, storeId, costsConfig));
        }
      })()
    );
  }

  await Promise.all(storeTasks);

  const adsStoreId = connectedStores[0]?.id ?? "store-ads-all";

  const aov =
    orders.length > 0 ? orders.reduce((a, o) => a + o.revenue, 0) / orders.length : 0;

  const adsTasks: Promise<void>[] = [];

  if (metaSession) {
    adsTasks.push(
      (async () => {
        const res = await fetchMetaCampaigns(metaSession);
        if (res.ok) {
          campaigns.push(...metaRowsToCampaigns(res.rows, adsStoreId));
        }
      })()
    );
  }

  if (googleSession?.refresh_token) {
    adsTasks.push(
      (async () => {
        const res = await fetchGoogleCampaigns(googleSession);
        if (res.ok) {
          campaigns.push(
            ...googleRowsToCampaigns(res.rows, adsStoreId).map((c) => ({
              ...c,
              attributed_revenue: (c.conversions ?? 0) * aov,
              roas_real: c.spend > 0 ? ((c.conversions ?? 0) * aov) / c.spend : 0,
            }))
          );
        }
      })()
    );
  }

  if (tiktokSession) {
    adsTasks.push(
      (async () => {
        const res = await fetchTikTokCampaigns(tiktokSession, historyDays);
        if (res.ok) {
          campaigns.push(
            ...tikTokRowsToCampaigns(res.rows, adsStoreId).map((c) => ({
              ...c,
              attributed_revenue: (c.conversions ?? 0) * aov,
              roas_real: c.spend > 0 ? ((c.conversions ?? 0) * aov) / c.spend : 0,
            }))
          );
        }
      })()
    );
  }

  await Promise.all(adsTasks);

  const totalAdSpend = campaigns.reduce((a, c) => a + c.spend, 0);
  const totalRevenue = orders.reduce((a, o) => a + o.revenue, 0);
  if (totalAdSpend > 0 && totalRevenue > 0) {
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const share = o.revenue / totalRevenue;
      orders[i] = {
        ...o,
        ads_spend_attributed: totalAdSpend * share,
      };
    }
  }

  orders.sort((a, b) => b.date.localeCompare(a.date));

  return {
    orders,
    campaigns,
    costsConfig,
    connectedStores,
    integrations: {
      shopify: Boolean(shopifySession),
      tiendanube: Boolean(tnSession),
      mercadolibre: Boolean(mlSession),
      meta: Boolean(metaSession),
      google: Boolean(googleSession?.refresh_token),
      tiktok: Boolean(tiktokSession),
    },
  };
}

/** Para tests / tipado Store en UI */
export function liveStoresToMockShape(
  stores: LiveConnectedStore[],
  userId: string
): Store[] {
  return stores.map((s) => ({
    id: s.id,
    user_id: userId,
    platform: s.platform,
    store_url: s.store_url,
    api_token: null,
    connected_at: new Date().toISOString(),
    status: "connected",
  }));
}
