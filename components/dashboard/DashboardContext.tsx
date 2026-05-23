"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserBillingMeta } from "@/lib/dodo-billing";
import type {
  AdsPlatformScope,
  Campaign,
  CostsConfig,
  DateRangeKey,
  Order,
  Plan,
  StorePlatform,
} from "@/types";
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
  countCompletedOrdersInCurrentMonth,
  mockCampaigns,
  mockCostsConfig,
  mockOrders,
  mockUser,
} from "@/lib/mock-data";
import type { RevenueChartRow } from "@/types";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";

export type StoreScope = "all" | string;

type ConnectedStoreOption = {
  id: string;
  label: string;
  platform: StorePlatform;
};

type Ctx = {
  dateRange: DateRangeKey;
  setDateRange: (r: DateRangeKey) => void;
  customRange: CustomDateBounds;
  setCustomRange: (c: CustomDateBounds) => void;
  rangeDisplayLabel: string;
  storeScope: StoreScope;
  setStoreScope: (s: StoreScope) => void;
  adsPlatform: AdsPlatformScope;
  setAdsPlatform: (p: AdsPlatformScope) => void;
  connectedStores: ConnectedStoreOption[];
  filteredOrders: Order[];
  /** Órdenes sin filtro de rango (para cupo Starter). */
  sourceOrders: Order[];
  allCampaigns: Campaign[];
  chartSeries: RevenueChartRow[];
  starterOrdersThisMonth: number;
  plan: Plan;
  billing: UserBillingMeta;
  costsConfig: CostsConfig;
  loadingLive: boolean;
  liveReady: boolean;
  refreshBootstrap: () => Promise<void>;
};

const DashboardContext = createContext<Ctx | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const isDemo = useDemoMode();

  const [dateRange, setDateRange] = useState<DateRangeKey>("30d");
  const [customRange, setCustomRange] = useState<CustomDateBounds>(() => {
    const b = getDateRangeBounds("30d");
    return { fromStr: b.fromStr, toStr: b.toStr };
  });
  const [storeScope, setStoreScope] = useState<StoreScope>("all");
  const [adsPlatform, setAdsPlatform] = useState<AdsPlatformScope>("meta");

  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [liveCampaigns, setLiveCampaigns] = useState<Campaign[]>([]);
  const [liveStores, setLiveStores] = useState<ConnectedStoreOption[]>([]);
  const [plan, setPlan] = useState<Plan>(mockUser.plan);
  const [billing, setBilling] = useState<UserBillingMeta>({});
  const [costsConfig, setCostsConfig] = useState<CostsConfig>(mockCostsConfig);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveReady, setLiveReady] = useState(false);

  const refreshBootstrap = useCallback(async () => {
    if (isDemo) return;
    setLoadingLive(true);
    try {
      const res = await fetch("/api/dashboard/bootstrap", { cache: "no-store" });
      if (!res.ok) {
        setLiveReady(false);
        return;
      }
      const data = (await res.json()) as {
        orders: Order[];
        campaigns: Campaign[];
        connectedStores: ConnectedStoreOption[];
        plan: Plan;
        billing?: UserBillingMeta;
        costsConfig: CostsConfig;
      };
      setLiveOrders(data.orders ?? []);
      setLiveCampaigns(data.campaigns ?? []);
      setLiveStores(data.connectedStores ?? []);
      setPlan(data.plan ?? "starter");
      setBilling(data.billing ?? {});
      setCostsConfig(data.costsConfig ?? mockCostsConfig);
      setLiveReady(true);
    } catch {
      setLiveReady(false);
    } finally {
      setLoadingLive(false);
    }
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      setLiveReady(false);
      return;
    }
    void refreshBootstrap();
  }, [isDemo, refreshBootstrap]);

  useEffect(() => {
    if (isDemo) return;
    const onFocus = () => void refreshBootstrap();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isDemo, refreshBootstrap]);

  const connectedStores = useMemo(() => {
    if (isDemo) {
      return [
        { id: "store-tn-1", label: "Tienda Nube (mitienda.mitiendanube.com)", platform: "tiendanube" as const },
        { id: "store-sh-1", label: "Shopify (mi-marca.myshopify.com)", platform: "shopify" as const },
        { id: "store-ml-1", label: "Mercado Libre", platform: "mercadolibre" as const },
      ];
    }
    return liveStores;
  }, [isDemo, liveStores]);

  const rangeDisplayLabel = useMemo(() => {
    if (dateRange !== "custom") return DATE_RANGE_LABELS[dateRange];
    return formatCustomRangeLabel(getDateRangeBounds("custom", customRange));
  }, [dateRange, customRange]);

  const allOrders = isDemo ? mockOrders : liveOrders;
  const allCampaigns = isDemo ? mockCampaigns : liveCampaigns;
  const effectivePlan = isDemo ? mockUser.plan : plan;

  const value = useMemo(() => {
    const customArg = dateRange === "custom" ? customRange : undefined;
    const storeFiltered = filterOrdersByStore(
      allOrders,
      storeScope === "all" ? null : storeScope
    );
    const cappedForPlan = applyStarterMonthlyOrderCap(storeFiltered, effectivePlan);
    const filteredOrders = filterOrdersByRange(cappedForPlan, dateRange, customArg);
    const seriesStoreId = storeScope === "all" ? null : storeScope;
    const chartSeries = buildRevenueChartSeries(
      dateRange,
      seriesStoreId,
      customArg,
      filteredOrders
    );
    const starterOrdersThisMonth = countCompletedOrdersInCurrentMonth(allOrders);
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
      sourceOrders: allOrders,
      allCampaigns,
      chartSeries,
      starterOrdersThisMonth,
      plan: effectivePlan,
      billing: isDemo ? {} : billing,
      costsConfig,
      loadingLive,
      liveReady,
      refreshBootstrap,
    };
  }, [
    dateRange,
    customRange,
    storeScope,
    adsPlatform,
    connectedStores,
    rangeDisplayLabel,
    allOrders,
    allCampaigns,
    effectivePlan,
    billing,
    costsConfig,
    loadingLive,
    liveReady,
    refreshBootstrap,
  ]);

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
