"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DateRangeKey, Order } from "@/types";
import { filterOrdersByRange, filterSeriesByRange } from "@/lib/dashboard-filters";
import { mockOrders, ordersLast30DaysSeries } from "@/lib/mock-data";

type Ctx = {
  dateRange: DateRangeKey;
  setDateRange: (r: DateRangeKey) => void;
  filteredOrders: Order[];
  chartSeries: ReturnType<typeof ordersLast30DaysSeries>;
};

const DashboardContext = createContext<Ctx | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRangeKey>("30d");

  const value = useMemo(() => {
    const filteredOrders = filterOrdersByRange(mockOrders, dateRange);
    const fullSeries = ordersLast30DaysSeries();
    const chartSeries = filterSeriesByRange(fullSeries, dateRange);
    return { dateRange, setDateRange, filteredOrders, chartSeries };
  }, [dateRange]);

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
