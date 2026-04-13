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

export interface Campaign {
  id: string;
  store_id: string;
  platform: string;
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

export interface ChannelProfitRow {
  channel: OrderChannel;
  sales: number;
  costs: number;
  profit: number;
  margin_percent: number;
}

export type DateRangeKey = "today" | "week" | "month" | "30d";

export interface DashboardMetrics {
  totalSales: number;
  salesChangePercent: number;
  netProfit: number;
  profitChangePercent: number;
  trueRoas: number;
  roasChangePercent: number;
  marginPercent: number;
  marginChangePercent: number;
}
