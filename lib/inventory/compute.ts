import { isoDateLocal } from "@/lib/dashboard-filters";
import type { Order } from "@/types";
import type {
  AdsInventorySignal,
  AdsInventorySignalType,
  DemandForecast,
  DemandForecastPoint,
  InventoryKPIs,
  InventoryStockRow,
  ProductInventoryIntel,
  StockRisk,
} from "@/lib/inventory/types";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDateLocal(d);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDateLocal(d);
}

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function shortDateLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// ─── Order filtering helpers ──────────────────────────────────────────────────

function ordersForProduct(orders: Order[], productName: string): Order[] {
  return orders.filter((o) => o.product_name === productName && o.status !== "cancelled");
}

function ordersInWindow(orders: Order[], fromIso: string, toIso: string): Order[] {
  return orders.filter((o) => o.date >= fromIso && o.date <= toIso);
}

// ─── Velocity computation ─────────────────────────────────────────────────────

/**
 * Weighted average daily sales velocity.
 * - Last 7 days: weight 3x
 * - Days 8-14: weight 2x
 * - Days 15-30: weight 1x
 * Returns 0 if no data.
 */
function computeWeightedDailyVelocity(orders: Order[]): number {
  const today = isoDateLocal(new Date());
  const d7 = daysAgoIso(7);
  const d14 = daysAgoIso(14);
  const d30 = daysAgoIso(30);

  const last7 = ordersInWindow(orders, d7, today).length;
  const days8to14 = ordersInWindow(orders, d14, d7).length;
  const days15to30 = ordersInWindow(orders, d30, d14).length;

  const weightedSum = last7 * 3 + days8to14 * 2 + days15to30 * 1;
  const weightedDays = 7 * 3 + 7 * 2 + 16 * 1;
  return weightedDays > 0 ? weightedSum / weightedDays : 0;
}

// ─── Risk classification ──────────────────────────────────────────────────────

function classifyRisk(
  daysUntilStockout: number | null,
  daysSinceLastSale: number,
  currentStock: number,
  hasStockData: boolean
): StockRisk {
  if (!hasStockData) return "unknown";
  if (currentStock <= 0) return "unknown";
  if (daysSinceLastSale >= 30 && currentStock > 0) return "dead";
  if (daysUntilStockout === null) return "healthy";
  if (daysUntilStockout < 5) return "critical";
  if (daysUntilStockout < 15) return "warning";
  if (daysUntilStockout > 60) return "overstock";
  return "healthy";
}

// ─── Ads × Inventory signal ───────────────────────────────────────────────────

function computeAdsInventorySignal(
  risk: StockRisk,
  marginPercent: number,
  adSpend30d: number,
  hasActiveAds: boolean,
  daysUntilStockout: number | null
): AdsInventorySignal | null {
  if (adSpend30d === 0 && !hasActiveAds) return null;

  let type: AdsInventorySignalType = "ok";
  let message = "";
  let urgency: AdsInventorySignal["urgency"] = "low";

  if (risk === "dead") {
    type = "pause_ads_dead_stock";
    message = "Stock sin movimiento. No corras ads — primero liquidá con descuento.";
    urgency = "medium";
  } else if (risk === "critical" && hasActiveAds) {
    type = "pause_ads_low_stock";
    message = `Quedan ~${daysUntilStockout ?? "pocos"} días de stock. Pausá los ads para no vender lo que no podés entregar.`;
    urgency = "high";
  } else if (risk === "warning" && hasActiveAds) {
    type = "restock_urgently";
    message = "Stock justo. Reponé ahora antes de que los ads llenen pedidos que no podés cumplir.";
    urgency = "high";
  } else if (risk === "healthy" && marginPercent >= 20 && hasActiveAds) {
    type = "scale_ads_good_margin";
    message = `Margen ${marginPercent.toFixed(0)}% + stock saludable. Momento ideal para escalar presupuesto.`;
    urgency = "low";
  } else if (risk === "overstock" && !hasActiveAds) {
    type = "scale_ads_good_margin";
    message = "Stock alto parado. Activá ads para mover el inventario y recuperar capital.";
    urgency = "medium";
  }

  if (type === "ok") return null;
  return { type, message, urgency };
}

// ─── Core compute function ────────────────────────────────────────────────────

export function computeProductInventoryIntel(
  productName: string,
  allOrders: Order[],
  stockRow: InventoryStockRow | null
): ProductInventoryIntel {
  const today = isoDateLocal(new Date());
  const d7 = daysAgoIso(7);
  const d30 = daysAgoIso(30);

  const productOrders = ordersForProduct(allOrders, productName);
  const orders30d = ordersInWindow(productOrders, d30, today);
  const orders7d = ordersInWindow(productOrders, d7, today);

  const unitsSold30d = orders30d.length;
  const unitsSold7d = orders7d.length;

  // Velocity
  const avgDailySales = unitsSold30d / 30;
  const weightedDailySales = computeWeightedDailyVelocity(orders30d);

  // Last sale date
  const sortedByDate = [...productOrders].sort((a, b) => b.date.localeCompare(a.date));
  const lastSaleDate = sortedByDate[0]?.date ?? null;
  const daysSinceLastSale = lastSaleDate ? daysBetween(lastSaleDate, today) : 9999;

  // Financial metrics
  const revenue30d = orders30d.reduce((s, o) => s + o.revenue, 0);
  const totalCost30d = orders30d.reduce(
    (s, o) => s + o.product_cost + o.shipping_cost + o.payment_commission + (o.ads_spend_attributed ?? 0),
    0
  );
  const netProfit30d = revenue30d - totalCost30d;
  const marginPercent = revenue30d > 0 ? (netProfit30d / revenue30d) * 100 : 0;
  const avgRevPerUnit = unitsSold30d > 0 ? revenue30d / unitsSold30d : 0;
  const estimatedCostPerUnit = unitsSold30d > 0 ? totalCost30d / unitsSold30d : 0;

  // Ads attribution
  const adSpend30d = orders30d.reduce((s, o) => s + (o.ads_spend_attributed ?? 0), 0);
  const productRoas = adSpend30d > 0 ? revenue30d / adSpend30d : 0;

  // Stock data
  const hasStockData = stockRow !== null;
  const currentStock = stockRow?.current_stock ?? 0;
  const costPerUnit = stockRow?.cost_per_unit ?? estimatedCostPerUnit;
  const reorderPoint = stockRow?.reorder_point ?? Math.ceil(avgDailySales * 7);
  const reorderQuantity = stockRow?.reorder_quantity ?? Math.ceil(avgDailySales * 30);
  const supplierLeadDays = stockRow?.supplier_lead_days ?? 7;

  // Stockout forecast
  const velocity = weightedDailySales > 0 ? weightedDailySales : avgDailySales;
  const daysUntilStockout =
    hasStockData && velocity > 0 ? Math.floor(currentStock / velocity) : null;
  const estimatedStockoutDate =
    daysUntilStockout !== null ? daysFromNow(daysUntilStockout) : null;

  // Reorder intelligence
  const daysUntilReorderPoint =
    hasStockData && velocity > 0 && currentStock > reorderPoint
      ? Math.floor((currentStock - reorderPoint) / velocity)
      : null;
  const shouldReorder = hasStockData && currentStock <= reorderPoint;

  // Inventory value
  const inventoryValue = currentStock * costPerUnit;

  // Sell-through rate
  const totalUnitsEver = unitsSold30d + currentStock;
  const sellThroughRate = totalUnitsEver > 0 ? (unitsSold30d / totalUnitsEver) * 100 : 0;

  // Risk
  const risk = classifyRisk(daysUntilStockout, daysSinceLastSale, currentStock, hasStockData);

  // Ads signal
  const adsInventorySignal = computeAdsInventorySignal(
    risk,
    marginPercent,
    adSpend30d,
    adSpend30d > 10,
    daysUntilStockout
  );

  return {
    productName,
    variantLabel: stockRow?.variant_label ?? null,
    externalSku: stockRow?.external_sku ?? null,
    currentStock,
    stockSource: stockRow?.stock_source ?? "manual",
    hasStockData,
    avgDailySales,
    weightedDailySales,
    unitsSold30d,
    unitsSold7d,
    daysSinceLastSale,
    daysUntilStockout,
    estimatedStockoutDate,
    risk,
    reorderPoint,
    reorderQuantity,
    supplierLeadDays,
    shouldReorder,
    daysUntilReorderPoint,
    revenue30d,
    totalCost30d,
    netProfit30d,
    marginPercent,
    avgRevPerUnit,
    costPerUnit,
    inventoryValue,
    sellThroughRate,
    adSpend30d,
    productRoas,
    hasActiveAds: adSpend30d > 10,
    adsInventorySignal,
  };
}

// ─── Full inventory payload compute ──────────────────────────────────────────

export function computeInventoryPayload(
  orders: Order[],
  stockRows: InventoryStockRow[]
): { products: ProductInventoryIntel[]; kpis: InventoryKPIs } {
  // Collect all product names from orders + stock rows
  const orderProducts = orders.map((o) => o.product_name);
  const stockProducts = stockRows.map((r) => r.product_name);
  const allNamesArr = Array.from(new Set([...orderProducts, ...stockProducts]));
  const allNames = allNamesArr;

  const stockByName = new Map(stockRows.map((r) => [r.product_name, r]));

  const products = allNames.map((name) =>
    computeProductInventoryIntel(name, orders, stockByName.get(name) ?? null)
  );

  // Sort: critical → warning → healthy → overstock → dead → unknown
  const riskOrder: StockRisk[] = ["critical", "warning", "healthy", "overstock", "dead", "unknown"];
  products.sort((a, b) => riskOrder.indexOf(a.risk) - riskOrder.indexOf(b.risk));

  // KPIs
  const kpis: InventoryKPIs = {
    totalSkus: products.length,
    skusWithStockData: products.filter((p) => p.hasStockData).length,
    criticalCount: products.filter((p) => p.risk === "critical").length,
    warningCount: products.filter((p) => p.risk === "warning").length,
    deadStockCount: products.filter((p) => p.risk === "dead").length,
    overstockCount: products.filter((p) => p.risk === "overstock").length,
    totalInventoryValue: products.reduce((s, p) => s + p.inventoryValue, 0),
    totalWastedInventoryValue: products
      .filter((p) => p.risk === "dead" || p.risk === "overstock")
      .reduce((s, p) => s + p.inventoryValue, 0),
    topRiskProduct: products.find((p) => p.risk === "critical" || p.risk === "warning") ?? null,
  };

  return { products, kpis };
}

// ─── Demand forecast ──────────────────────────────────────────────────────────

export function computeDemandForecast(
  intel: ProductInventoryIntel,
  forecastDays = 30
): DemandForecast {
  const velocity = intel.weightedDailySales > 0
    ? intel.weightedDailySales
    : intel.avgDailySales;

  const today = new Date();
  let projectedStock = intel.hasStockData ? intel.currentStock : null;
  let projectedStockoutDate: string | null = null;
  const points: DemandForecastPoint[] = [];

  for (let i = 1; i <= forecastDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = isoDateLocal(d);
    const forecastedUnits = Math.max(0, Math.round(velocity));

    if (projectedStock !== null) {
      projectedStock = Math.max(0, projectedStock - forecastedUnits);
      if (projectedStock === 0 && projectedStockoutDate === null) {
        projectedStockoutDate = iso;
      }
    }

    points.push({
      date: iso,
      label: shortDateLabel(iso),
      forecastedUnits,
      projectedStock,
    });
  }

  // Confidence: based on data volume (more orders = higher confidence)
  const confidence = Math.min(
    95,
    Math.max(
      30,
      intel.unitsSold30d >= 30 ? 90 : intel.unitsSold30d >= 15 ? 75 : intel.unitsSold30d >= 5 ? 55 : 35
    )
  );

  return { points, projectedStockoutDate, confidence };
}
