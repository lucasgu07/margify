// ─── Stock record (from DB or user input) ────────────────────────────────────

export type StockSource = "manual" | "shopify" | "tiendanube" | "mercadolibre";

export type InventoryStockRow = {
  id: string;
  user_id: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  supplier_lead_days: number;
  cost_per_unit: number | null;
  external_sku: string | null;
  variant_label: string | null;
  stock_source: StockSource;
  last_synced_at: string | null;
  updated_at: string;
};

// ─── Risk classification ──────────────────────────────────────────────────────

export type StockRisk =
  | "critical"    // < 5 days until stockout
  | "warning"     // 5–14 days until stockout
  | "healthy"     // 15–59 days
  | "overstock"   // > 60 days (too much tied up in stock)
  | "dead"        // no sales in last 30 days AND stock > 0
  | "unknown";    // no stock data entered

// ─── Single product intelligence record ──────────────────────────────────────

export type ProductInventoryIntel = {
  // Identity
  productName: string;
  variantLabel: string | null;
  externalSku: string | null;

  // Stock
  currentStock: number;
  stockSource: StockSource;
  hasStockData: boolean;

  // Velocity (sales pace)
  /** Average units sold per day over the last 30 days */
  avgDailySales: number;
  /** Average units sold per day — weighted toward recent 7 days (3x weight) */
  weightedDailySales: number;
  /** Total units sold in the last 30 days */
  unitsSold30d: number;
  /** Total units sold in the last 7 days */
  unitsSold7d: number;
  /** Days since the last recorded sale */
  daysSinceLastSale: number;

  // Stockout forecast
  /** Estimated days until stock hits 0 at current velocity. Null if no stock data. */
  daysUntilStockout: number | null;
  /** ISO date string of estimated stockout. Null if no stock data. */
  estimatedStockoutDate: string | null;
  /** Risk level based on daysUntilStockout */
  risk: StockRisk;

  // Reorder intelligence
  reorderPoint: number;
  reorderQuantity: number;
  supplierLeadDays: number;
  /** True when current_stock <= reorder_point */
  shouldReorder: boolean;
  /** Days until reorder point is hit at current velocity */
  daysUntilReorderPoint: number | null;

  // Profitability
  revenue30d: number;
  totalCost30d: number;
  netProfit30d: number;
  marginPercent: number;
  /** Average revenue per unit */
  avgRevPerUnit: number;
  /** Cost per unit (from DB if set, else estimated from order data) */
  costPerUnit: number;
  /** Total value of current stock (currentStock × costPerUnit) */
  inventoryValue: number;

  // Sell-through rate (units sold / (units sold + current stock))
  sellThroughRate: number;

  // Ads relationship
  /** Total ad spend attributed to this product in last 30 days */
  adSpend30d: number;
  /** Product-level ROAS (attributed revenue / ad spend) */
  productRoas: number;
  /** Whether active ad campaigns are running for this product */
  hasActiveAds: boolean;
  /** AI recommendation about ads ↔ inventory relationship */
  adsInventorySignal: AdsInventorySignal | null;
};

// ─── Ads × Inventory signal ───────────────────────────────────────────────────

export type AdsInventorySignalType =
  | "pause_ads_low_stock"   // Stock < 7 days; burning money on ads that can't convert
  | "scale_ads_good_margin" // High margin + healthy stock = scale opportunity
  | "pause_ads_dead_stock"  // Dead stock: ads won't move it, need other tactics
  | "restock_urgently"      // Ads running but stock about to run out
  | "ok";

export type AdsInventorySignal = {
  type: AdsInventorySignalType;
  message: string;
  urgency: "high" | "medium" | "low";
};

// ─── Inventory overview KPIs ──────────────────────────────────────────────────

export type InventoryKPIs = {
  totalSkus: number;
  skusWithStockData: number;
  criticalCount: number;     // < 5 days
  warningCount: number;      // 5-14 days
  deadStockCount: number;    // no sales + stock sitting
  overstockCount: number;    // > 60 days
  totalInventoryValue: number;
  totalWastedInventoryValue: number; // value of dead stock
  topRiskProduct: ProductInventoryIntel | null;
};

// ─── Demand forecast ─────────────────────────────────────────────────────────

export type DemandForecastPoint = {
  /** ISO date string */
  date: string;
  /** Short label (e.g. "Jun 10") */
  label: string;
  /** Forecasted units to sell on this date */
  forecastedUnits: number;
  /** Forecasted cumulative stock remaining */
  projectedStock: number | null;
};

export type DemandForecast = {
  points: DemandForecastPoint[];
  /** ISO date of projected stockout (null if stock outlasts forecast window) */
  projectedStockoutDate: string | null;
  /** Confidence 0-100 based on data quality */
  confidence: number;
};

// ─── Full inventory payload returned by API ──────────────────────────────────

export type InventoryPayload = {
  products: ProductInventoryIntel[];
  kpis: InventoryKPIs;
  generatedAt: string;
};
