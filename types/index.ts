export type Plan = "starter" | "growth" | "scale" | "agency";

export type StorePlatform = "tiendanube" | "shopify" | "mercadolibre";

export type OrderChannel = "TiendaNube" | "Shopify" | "MercadoLibre";

export type OrderStatus = "completed" | "pending" | "cancelled";

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  plan: Plan;
  whatsapp_number: string | null;
}

export interface Store {
  id: string;
  user_id: string;
  platform: StorePlatform;
  store_url: string;
  api_token: string | null;
  connected_at: string;
  status: "connected" | "disconnected" | "error";
}

export interface Order {
  id: string;
  store_id: string;
  external_id: string;
  date: string;
  revenue: number;
  product_name: string;
  product_cost: number;
  shipping_cost: number;
  payment_commission: number;
  /** Gasto en ads atribuido a la orden (pixel propio / modelo Margify) */
  ads_spend_attributed?: number;
  channel: OrderChannel;
  status: OrderStatus;
}

/** Plataforma de anuncios (selector en Campañas). */
export type AdsPlatformScope = "meta" | "tiktok" | "google";

export interface Campaign {
  id: string;
  store_id: string;
  platform: AdsPlatformScope;
  campaign_name: string;
  spend: number;
  attributed_revenue: number;
  roas_platform: number;
  roas_real: number;
  status: "active" | "paused";
  date: string;
  /** Conversiones verificadas (modelo demo) */
  conversions?: number;
}

export interface CostsConfig {
  id: string;
  user_id: string;
  product_cost_percent: number;
  payment_commission_percent: number;
  shipping_cost_fixed: number;
  agency_fee_percent: number;
}

export type AlertType =
  | "roas_drop"
  | "margin_drop"
  | "cashflow_negative"
  | "campaign_no_conversions"
  | "product_no_profit"
  | "weekly_summary";

export type AlertChannel = "email" | "whatsapp" | "both";

export interface AlertsConfig {
  id: string;
  user_id: string;
  alert_type: AlertType;
  threshold: number;
  channel: AlertChannel;
  active: boolean;
}

export interface AlertHistory {
  id: string;
  user_id: string;
  alert_type: AlertType;
  message: string;
  triggered_at: string;
  read: boolean;
}

export interface ProductProfit {
  id: string;
  name: string;
  image_url: string | null;
  units_sold: number;
  revenue: number;
  total_cost: number;
  profit: number;
  margin_percent: number;
}

export interface CashflowEntry {
  id: string;
  sale_date: string;
  amount: number;
  payment_method: "Mercado Pago" | "Tarjeta" | "Efectivo";
  estimated_payout_date: string;
  status: "Cobrado" | "Pendiente" | "En proceso";
}

/** Fila enriquecida para la tabla de Cashflow (demo con órdenes importadas). */
export interface CashflowTableRow {
  id: string;
  order_external_id: string;
  sale_date: string;
  payout_date: string;
  status: CashflowEntry["status"];
  total_order: number;
  liquidable: number;
  comision: number;
  origin: OrderChannel;
  gateway: string;
  payment_method: CashflowEntry["payment_method"];
  cuotas: number;
}

export interface ChannelProfitRow {
  channel: OrderChannel;
  sales: number;
  costs: number;
  profit: number;
  margin_percent: number;
}

export type DateRangeKey =
  | "today"
  | "week"
  | "month"
  | "30d"
  | "6m"
  | "1y"
  | "year"
  | "custom";

/** Punto del gráfico de ingresos del dashboard (día u hora) */
export interface RevenueChartRow {
  /** Etiqueta corta en el eje X (MM-DD o HH:00) */
  date: string;
  /** Texto para tooltip (día u hora legible) */
  labelTooltip: string;
  ventas: number;
  ganancia: number;
  ads: number;
  isoDate?: string;
  hour?: number;
}

export interface DashboardMetrics {
  totalSales: number;
  salesChangePercent: number;
  netProfit: number;
  profitChangePercent: number;
  trueRoas: number;
  roasChangePercent: number;
  marginPercent: number;
  marginChangePercent: number;
  /** Pedidos en el período (órdenes concretadas) */
  orderCount: number;
  orderCountChangePercent: number;
  /** Ticket promedio (AOV) */
  aov: number;
  aovChangePercent: number;
  /** Suma de gasto en ads atribuido a órdenes (modelo Margify) */
  adSpendAttributed: number;
  adSpendChangePercent: number;
  /** MER: ventas totales / gasto en ads (por cada USD invertido, cuánto vuelve en ventas) */
  mer: number;
  merChangePercent: number;
}
