import type {
  AlertHistory,
  Campaign,
  CashflowEntry,
  ChannelProfitRow,
  CostsConfig,
  Order,
  OrderChannel,
  ProductProfit,
  Store,
  User,
} from "@/types";
import { addBusinessDays, orderProfit } from "@/lib/calculations";

const USER_ID = "demo-user-1";

export const mockUser: User = {
  id: USER_ID,
  email: "lucas@margify.app",
  full_name: "Lucas",
  created_at: "2025-01-10T12:00:00.000Z",
  plan: "growth",
  whatsapp_number: "+5491122334455",
};

export const mockStores: Store[] = [
  {
    id: "store-tn-1",
    user_id: USER_ID,
    platform: "tiendanube",
    store_url: "https://mitienda.mitiendanube.com",
    api_token: "••••••",
    connected_at: "2025-02-01T10:00:00.000Z",
    status: "connected",
  },
  {
    id: "store-ml-1",
    user_id: USER_ID,
    platform: "mercadolibre",
    store_url: "https://www.mercadolibre.com.ar/perfil/MI_TIENDA",
    api_token: null,
    connected_at: "2025-02-05T14:20:00.000Z",
    status: "connected",
  },
  {
    id: "store-sh-1",
    user_id: USER_ID,
    platform: "shopify",
    store_url: "https://mi-marca.myshopify.com",
    api_token: "••••••",
    connected_at: "2025-02-12T09:00:00.000Z",
    status: "connected",
  },
];

export const mockCostsConfig: CostsConfig = {
  id: "costs-1",
  user_id: USER_ID,
  product_cost_percent: 40,
  payment_commission_percent: 3.5,
  shipping_cost_fixed: 5,
  agency_fee_percent: 0,
};

const productNames = [
  "Remera oversize negra",
  "Jean straight azul",
  "Zapatillas urbanas",
  "Hoodie frisa gris",
  "Gorra trucker",
  "Buzo canguro verde",
  "Campera rompevientos",
  "Medias pack x3",
  "Riñonera negra",
  "Short deportivo",
  "Musculosa dry-fit",
  "Mochila urbana",
  "Pantalón chino beige",
  "Camisa linen blanca",
  "Lentes polarizados",
];

const channels: OrderChannel[] = [
  "TiendaNube",
  "MercadoLibre",
  "Shopify",
];

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildRawOrders(): Order[] {
  const orders: Order[] = [];
  const now = new Date();
  for (let i = 0; i < 150; i++) {
    const dayOffset = Math.floor(i / 5) % 30;
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    const revenue = 120 + (i * 37) % 520 + Math.sin(i) * 40;
    const product_cost = revenue * (0.32 + (i % 7) * 0.02);
    const shipping_cost = 4 + (i % 3);
    const payment_commission = revenue * 0.035;
    const ads_spend_attributed = revenue * (0.08 + (i % 5) * 0.01);
    const channel = channels[i % channels.length];
    orders.push({
      id: `ord-${i + 1}`,
      store_id: mockStores[i % mockStores.length].id,
      external_id: `EXT-${10000 + i}`,
      date: isoDate(d),
      revenue: Math.round(revenue * 100) / 100,
      product_name: productNames[i % productNames.length],
      product_cost: Math.round(product_cost * 100) / 100,
      shipping_cost: Math.round(shipping_cost * 100) / 100,
      payment_commission: Math.round(payment_commission * 100) / 100,
      ads_spend_attributed: Math.round(ads_spend_attributed * 100) / 100,
      channel,
      status: "completed",
    });
  }
  return orders;
}

function normalizeOrdersToTargets(
  orders: Order[],
  targetRevenue: number,
  targetProfit: number
) {
  const sumRev = orders.reduce((a, o) => a + o.revenue, 0);
  const sumDirectCost = orders.reduce(
    (a, o) =>
      a +
      o.product_cost +
      o.shipping_cost +
      o.payment_commission +
      (o.ads_spend_attributed ?? 0),
    0
  );
  const sr = targetRevenue / sumRev;
  const scaledRev = orders.map((o) => o.revenue * sr);
  const scaledDirect = orders.map(
    (o) =>
      (o.product_cost + o.shipping_cost + o.payment_commission + (o.ads_spend_attributed ?? 0)) *
      sr
  );
  const sumScaledRev = scaledRev.reduce((a, v) => a + v, 0);
  const sumScaledDirect = scaledDirect.reduce((a, v) => a + v, 0);
  const k = (sumScaledRev - targetProfit) / sumScaledDirect;
  return orders.map((o, i) => {
    const r = scaledRev[i];
    const factor = k * sr;
    const pc = o.product_cost * factor;
    const sc = o.shipping_cost * factor;
    const pay = o.payment_commission * factor;
    const ads = (o.ads_spend_attributed ?? 0) * factor;
    return {
      ...o,
      revenue: Math.round(r * 100) / 100,
      product_cost: Math.round(pc * 100) / 100,
      shipping_cost: Math.round(sc * 100) / 100,
      payment_commission: Math.round(pay * 100) / 100,
      ads_spend_attributed: Math.round(ads * 100) / 100,
    };
  });
}

const TARGET_REV = 48320;
const TARGET_PROFIT = 12840;

export const mockOrders: Order[] = normalizeOrdersToTargets(
  buildRawOrders(),
  TARGET_REV,
  TARGET_PROFIT
);

/** Gasto y ventas atribuidas calibrados para ROAS real ~2.8x agregado */
export const mockCampaigns: Campaign[] = [
  {
    id: "camp-1",
    store_id: mockStores[0].id,
    platform: "meta",
    campaign_name: "Verano — Conversión",
    spend: 4200,
    attributed_revenue: 13100,
    roas_platform: 3.4,
    roas_real: 3.12,
    status: "active",
    date: isoDate(new Date()),
    conversions: 118,
  },
  {
    id: "camp-2",
    store_id: mockStores[0].id,
    platform: "meta",
    campaign_name: "Remarketing carrito",
    spend: 2100,
    attributed_revenue: 8400,
    roas_platform: 4.1,
    roas_real: 4.0,
    status: "active",
    date: isoDate(new Date()),
    conversions: 86,
  },
  {
    id: "camp-3",
    store_id: mockStores[1].id,
    platform: "meta",
    campaign_name: "Lanzamiento jean",
    spend: 3800,
    attributed_revenue: 7600,
    roas_platform: 2.6,
    roas_real: 2.0,
    status: "paused",
    date: isoDate(new Date()),
    conversions: 52,
  },
  {
    id: "camp-4",
    store_id: mockStores[0].id,
    platform: "meta",
    campaign_name: "Advantage+ Shopping",
    spend: 5600,
    attributed_revenue: 21100,
    roas_platform: 3.9,
    roas_real: 3.77,
    status: "active",
    date: isoDate(new Date()),
    conversions: 203,
  },
  {
    id: "camp-5",
    store_id: mockStores[2].id,
    platform: "meta",
    campaign_name: "Cold traffic LATAM",
    spend: 4900,
    attributed_revenue: 13775,
    roas_platform: 2.2,
    roas_real: 2.81,
    status: "active",
    date: isoDate(new Date()),
    conversions: 141,
  },
  {
    id: "camp-6",
    store_id: mockStores[0].id,
    platform: "meta",
    campaign_name: "Creativos UGC",
    spend: 1750,
    attributed_revenue: 6125,
    roas_platform: 3.8,
    roas_real: 3.5,
    status: "active",
    date: isoDate(new Date()),
    conversions: 64,
  },
  {
    id: "camp-7",
    store_id: mockStores[1].id,
    platform: "meta",
    campaign_name: "Catálogo dinámico",
    spend: 3200,
    attributed_revenue: 4800,
    roas_platform: 1.9,
    roas_real: 1.5,
    status: "paused",
    date: isoDate(new Date()),
    conversions: 38,
  },
  {
    id: "camp-8",
    store_id: mockStores[2].id,
    platform: "meta",
    campaign_name: "Brand awareness",
    spend: 2400,
    attributed_revenue: 3360,
    roas_platform: 1.7,
    roas_real: 1.4,
    status: "active",
    date: isoDate(new Date()),
    conversions: 29,
  },
];

export const mockAlertsHistory: AlertHistory[] = [
  {
    id: "ah-1",
    user_id: USER_ID,
    alert_type: "roas_drop",
    message:
      "ROAS real de la campaña \"Lanzamiento jean\" cayó a 2.0x (umbral 1.5x).",
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: "ah-2",
    user_id: USER_ID,
    alert_type: "margin_drop",
    message: "Tu margen neto promedio bajó al 22% en las últimas 48 horas.",
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    read: true,
  },
  {
    id: "ah-3",
    user_id: USER_ID,
    alert_type: "campaign_no_conversions",
    message:
      "La campaña \"Brand awareness\" lleva 3 días con gasto activo y 0 conversiones verificadas.",
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: false,
  },
  {
    id: "ah-4",
    user_id: USER_ID,
    alert_type: "product_no_profit",
    message: "Detectamos ventas sin ganancia en \"Medias pack x3\".",
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read: true,
  },
  {
    id: "ah-5",
    user_id: USER_ID,
    alert_type: "weekly_summary",
    message: "Resumen semanal: ganancia neta +8% vs. semana anterior.",
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    read: true,
  },
];

export function aggregateFromOrders(orders: Order[]) {
  const totalSales = orders.reduce((a, o) => a + o.revenue, 0);
  const netProfit = orders.reduce(
    (a, o) =>
      a +
      orderProfit({
        revenue: o.revenue,
        product_cost: o.product_cost,
        shipping_cost: o.shipping_cost,
        payment_commission: o.payment_commission,
        ads_spend_attributed: o.ads_spend_attributed,
      }),
    0
  );
  const marginPercent = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
  const totalSpend = mockCampaigns.reduce((a, c) => a + c.spend, 0);
  const totalAttr = mockCampaigns.reduce((a, c) => a + c.attributed_revenue, 0);
  const trueRoas = totalSpend > 0 ? totalAttr / totalSpend : 0;
  return { totalSales, netProfit, marginPercent, trueRoas, totalSpend, totalAttr };
}

export function getDashboardMetrics(orders: Order[] = mockOrders) {
  const cur = aggregateFromOrders(orders);
  const prevOrders = orders.map((o) => ({
    ...o,
    revenue: o.revenue * 0.92,
    product_cost: o.product_cost * 0.95,
  }));
  const prev = aggregateFromOrders(prevOrders.length ? prevOrders : orders);
  const pct = (a: number, b: number) => {
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
    return ((a - b) / Math.abs(b)) * 100;
  };
  return {
    totalSales: cur.totalSales,
    salesChangePercent: pct(cur.totalSales, prev.totalSales),
    netProfit: cur.netProfit,
    profitChangePercent: pct(cur.netProfit, prev.netProfit),
    trueRoas: cur.trueRoas,
    roasChangePercent: pct(cur.trueRoas, prev.trueRoas * 0.94),
    marginPercent: cur.marginPercent,
    marginChangePercent: pct(cur.marginPercent, prev.marginPercent * 0.97),
  };
}

export function ordersLast30DaysSeries() {
  const now = new Date();
  const days: { date: string; ventas: number; ganancia: number; ads: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = isoDate(d);
    const dayOrders = mockOrders.filter((o) => o.date === key);
    const ventas = dayOrders.reduce((a, o) => a + o.revenue, 0);
    const ganancia = dayOrders.reduce(
      (a, o) =>
        a +
        orderProfit({
          revenue: o.revenue,
          product_cost: o.product_cost,
          shipping_cost: o.shipping_cost,
          payment_commission: o.payment_commission,
          ads_spend_attributed: o.ads_spend_attributed,
        }),
      0
    );
    const ads = dayOrders.reduce((a, o) => a + (o.ads_spend_attributed ?? 0), 0);
    days.push({
      date: key.slice(5),
      ventas: Math.round(ventas),
      ganancia: Math.round(ganancia),
      ads: Math.round(ads),
    });
  }
  return days;
}

export function channelProfitRows(): ChannelProfitRow[] {
  const map = new Map<OrderChannel, { sales: number; costs: number; profit: number }>();
  for (const ch of channels) {
    map.set(ch, { sales: 0, costs: 0, profit: 0 });
  }
  for (const o of mockOrders) {
    const row = map.get(o.channel)!;
    row.sales += o.revenue;
    const costs =
      o.product_cost + o.shipping_cost + o.payment_commission + (o.ads_spend_attributed ?? 0);
    row.costs += costs;
    row.profit += o.revenue - costs;
  }
  return channels.map((channel) => {
    const r = map.get(channel)!;
    return {
      channel,
      sales: Math.round(r.sales),
      costs: Math.round(r.costs),
      profit: Math.round(r.profit),
      margin_percent: r.sales > 0 ? (r.profit / r.sales) * 100 : 0,
    };
  });
}

export function buildProductProfits(): ProductProfit[] {
  const byName = new Map<string, ProductProfit>();
  for (const o of mockOrders) {
    const p =
      orderProfit({
        revenue: o.revenue,
        product_cost: o.product_cost,
        shipping_cost: o.shipping_cost,
        payment_commission: o.payment_commission,
        ads_spend_attributed: o.ads_spend_attributed,
      }) ?? 0;
    const costs =
      o.product_cost + o.shipping_cost + o.payment_commission + (o.ads_spend_attributed ?? 0);
    const cur = byName.get(o.product_name);
    if (!cur) {
      byName.set(o.product_name, {
        id: o.product_name,
        name: o.product_name,
        image_url: null,
        units_sold: 1,
        revenue: o.revenue,
        total_cost: costs,
        profit: p,
        margin_percent: o.revenue > 0 ? (p / o.revenue) * 100 : 0,
      });
    } else {
      cur.units_sold += 1;
      cur.revenue += o.revenue;
      cur.total_cost += costs;
      cur.profit += p;
      cur.margin_percent = cur.revenue > 0 ? (cur.profit / cur.revenue) * 100 : 0;
    }
  }
  return Array.from(byName.values()).sort((a, b) => b.profit - a.profit);
}

export function buildCashflowEntries(): CashflowEntry[] {
  const methods: CashflowEntry["payment_method"][] = [
    "Mercado Pago",
    "Tarjeta",
    "Efectivo",
  ];
  return mockOrders.slice(0, 40).map((o, i) => {
    const payment_method = methods[i % methods.length];
    const saleDate = new Date(o.date);
    const estimated = addBusinessDays(
      saleDate,
      payment_method === "Mercado Pago" ? 14 : payment_method === "Tarjeta" ? 2 : 0
    );
    const status: CashflowEntry["status"] =
      i % 7 === 0 ? "Cobrado" : i % 5 === 0 ? "En proceso" : "Pendiente";
    return {
      id: `cf-${o.id}`,
      sale_date: o.date,
      amount: o.revenue,
      payment_method,
      estimated_payout_date: isoDate(estimated),
      status,
    };
  });
}

export function cashflowSummary() {
  const entries = buildCashflowEntries();
  const now = new Date();
  const startOfWeek = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay();
    const diff = (day + 6) % 7;
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const sow = startOfWeek(now);
  const eow = new Date(sow);
  eow.setDate(eow.getDate() + 7);
  const nextWeekEnd = new Date(eow);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
  let thisWeek = 0;
  let nextWeek = 0;
  let month = 0;
  for (const e of entries) {
    const payout = new Date(e.estimated_payout_date);
    if (payout >= sow && payout < eow) thisWeek += e.amount;
    if (payout >= eow && payout < nextWeekEnd) nextWeek += e.amount;
    if (payout.getMonth() === now.getMonth() && payout.getFullYear() === now.getFullYear()) {
      month += e.amount;
    }
  }
  return { thisWeek, nextWeek, month };
}
