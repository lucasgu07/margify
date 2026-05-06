"use client";

import { useMemo } from "react";
import { BarChart3, DollarSign, Package, Percent, Receipt, ShoppingBag, Target, Wallet } from "lucide-react";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { buildDashboardAdvisorInsights } from "@/lib/ai-advisor-insights";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MetricCard } from "@/components/ui/MetricCard";
import { cn } from "@/lib/utils";
import { getDashboardMetrics } from "@/lib/mock-data";

/** Contenido del home del dashboard (métricas, gráfico, órdenes, IA). */
export function DashboardHomeBody({ variant = "default" }: { variant?: "default" | "landingHero" }) {
  const { dateRange, filteredOrders, chartSeries, storeScope, rangeDisplayLabel } = useDashboard();
  const m = getDashboardMetrics(filteredOrders, storeScope === "all" ? null : storeScope);
  const advisorInsights = useMemo(
    () => buildDashboardAdvisorInsights(filteredOrders, storeScope),
    [filteredOrders, storeScope]
  );

  const hero = variant === "landingHero";
  const cardCls = hero ? "gap-2 p-3 [&_svg]:h-4 [&_svg]:w-4 [&_p:first-of-type]:text-xs" : undefined;
  const valueCls = hero ? "text-xl !font-bold md:text-2xl" : undefined;

  return (
    <>
      <div className={cn("grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4", hero ? "gap-2" : "gap-4")}>
        <MetricCard
          title="Ventas totales"
          value={m.totalSales}
          change={m.salesChangePercent}
          icon={ShoppingBag}
          className={cardCls}
          valueClassName={valueCls}
          compact={hero}
          glass={!hero}
        />
        <MetricCard
          title="Ganancia neta"
          value={m.netProfit}
          change={m.profitChangePercent}
          icon={DollarSign}
          className={cardCls}
          valueClassName={valueCls}
          compact={hero}
          glass={!hero}
        />
        <MetricCard
          title="ROAS real"
          value={m.trueRoas}
          valueIsCurrency={false}
          suffix="x"
          change={m.roasChangePercent}
          icon={Target}
          className={cardCls}
          valueClassName={valueCls}
          glass={!hero}
        />
        <MetricCard
          title="Margen %"
          value={m.marginPercent}
          valueIsCurrency={false}
          suffix="%"
          change={m.marginChangePercent}
          icon={Percent}
          progress={Math.min(100, Math.max(0, m.marginPercent))}
          className={cardCls}
          valueClassName={valueCls}
          glass={!hero}
        />
      </div>
      <div className={cn("grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4", hero ? "mt-2 gap-2" : "mt-4 gap-4")}>
        <MetricCard
          title="Órdenes"
          value={m.orderCount}
          valueIsCurrency={false}
          decimals={0}
          change={m.orderCountChangePercent}
          icon={Package}
          className={cardCls}
          valueClassName={valueCls}
          glass={!hero}
        />
        <MetricCard
          title="Ticket promedio"
          value={m.aov}
          change={m.aovChangePercent}
          icon={Receipt}
          className={cardCls}
          valueClassName={valueCls}
          compact={hero}
          glass={!hero}
        />
        <MetricCard
          title="Gasto en ads (atribuido)"
          value={m.adSpendAttributed}
          change={m.adSpendChangePercent}
          icon={Wallet}
          integrationBrand="meta"
          className={cardCls}
          valueClassName={valueCls}
          compact={hero}
          glass={!hero}
        />
        <MetricCard
          title="MER (ventas / ads)"
          value={m.mer}
          valueIsCurrency={false}
          suffix="×"
          change={m.merChangePercent}
          icon={BarChart3}
          className={cardCls}
          valueClassName={valueCls}
          glass={!hero}
        />
      </div>
      <div className={hero ? "mt-4 space-y-4" : "mt-8 space-y-8"}>
        <RevenueChart
          data={chartSeries}
          dateRange={dateRange}
          rangeLabel={rangeDisplayLabel}
          compact={hero}
        />
        {!hero ? (
          <>
            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">Órdenes recientes</h2>
              <OrdersTable orders={filteredOrders} />
            </div>
            <AIAdvisor insights={advisorInsights} />
          </>
        ) : null}
      </div>
    </>
  );
}
