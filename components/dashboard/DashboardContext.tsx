"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { AdsPlatformScope, DateRangeKey, Order, StorePlatform } from "@/types";
import {
  DATE_RANGE_LABELS,
  filterOrdersByRange,
  filterOrdersByStore,
  formatCustomRangeLabel,
  getDateRangeBounds,
  type CustomDateBounds,
} from "@/lib/dashboard-filters";
import {
  applyStarterMonthlyOrderCap,
  buildRevenueChartSeries,
  mockOrders,
  mockStores,
  mockUser,
  storeShortLabel,
} from "@/lib/mock-data";
import type { RevenueChartRow } from "@/types";

export type StoreScope = "all" | string;

type Ctx = {
  dateRange: DateRangeKey;
  setDateRange: (r: DateRangeKey) => void;
  customRange: CustomDateBounds;
  setCustomRange: (c: CustomDateBounds) => void;
  /** Texto para títulos de gráficos (incluye fechas si el rango es personalizado). */
  rangeDisplayLabel: string;
  storeScope: StoreScope;
  setStoreScope: (s: StoreScope) => void;
  /** Meta / TikTok / Google Ads (pantalla Campañas). */
  adsPlatform: AdsPlatformScope;
  setAdsPlatform: (p: AdsPlatformScope) => void;
  connectedStores: { id: string; label: string; platform: StorePlatform }[];
  filteredOrders: Order[];
  chartSeries: RevenueChartRow[];
};

const DashboardContext = createContext<Ctx | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRangeKey>("30d");
  const [customRange, setCustomRange] = useState<CustomDateBounds>(() => {
    const b = getDateRangeBounds("30d");
    return { fromStr: b.fromStr, toStr: b.toStr };
  });
  const [storeScope, setStoreScope] = useState<StoreScope>("all");
  const [adsPlatform, setAdsPlatform] = useState<AdsPlatformScope>("meta");

  const connectedStores = useMemo(
    () =>
      mockStores
        .filter((s) => s.status === "connected")
        .map((s) => ({ id: s.id, label: storeShortLabel(s), platform: s.platform })),
    []
  );

  const rangeDisplayLabel = useMemo(() => {
    if (dateRange !== "custom") return DATE_RANGE_LABELS[dateRange];
    return formatCustomRangeLabel(getDateRangeBounds("custom", customRange));
  }, [dateRange, customRange]);

  const value = useMemo(() => {
    const customArg = dateRange === "custom" ? customRange : undefined;
    const storeFiltered = filterOrdersByStore(
      mockOrders,
      storeScope === "all" ? null : storeScope
    );
    const cappedForPlan = applyStarterMonthlyOrderCap(storeFiltered, mockUser.plan);
    const filteredOrders = filterOrdersByRange(cappedForPlan, dateRange, customArg);
    const seriesStoreId = storeScope === "all" ? null : storeScope;
    const chartSeries = buildRevenueChartSeries(
      dateRange,
      seriesStoreId,
      customArg,
      filteredOrders
    );
    return {
      dateRange,
      setDateRange,
      customRange,
      setCustomRange,
      rangeDisplayLabel,
      storeScope,
      setStoreScope,
      adsPlatform,
      setAdsPlatform,
      connectedStores,
      filteredOrders,
      chartSeries,
    };
  }, [dateRange, customRange, storeScope, adsPlatform, connectedStores, rangeDisplayLabel]);

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard debe usarse dentro de DashboardProvider");
  }
  return ctx;
}
