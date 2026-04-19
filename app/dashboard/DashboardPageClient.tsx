"use client";

import { useMemo } from "react";
import { BarChart3, DollarSign, Package, Percent, Receipt, ShoppingBag, Target, Wallet } from "lucide-react";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { buildDashboardAdvisorInsights } from "@/lib/ai-advisor-insights";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Header } from "@/components/ui/Header";
import { MetricCard } from "@/components/ui/MetricCard";
import { getDashboardMetrics } from "@/lib/mock-data";

export function DashboardPageClient() {
  const { full_name } = useDashboardIdentity();
  const { dateRange, filteredOrders, chartSeries, storeScope, rangeDisplayLabel } = useDashboard();
  const m = getDashboardMetrics(filteredOrders, storeScope === "all" ? null : storeScope);
  const advisorInsights = useMemo(
    () => buildDashboardAdvisorInsights(filteredOrders, storeScope),
    [filteredOrders, storeScope]
  );

  return (
    <>
      <Header
        userName={full_name}
        showConnect
        onConnect={() => {
          window.location.href = "/dashboard/configuracion";
        }}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Ventas totales"
          value={m.totalSales}
          change={m.salesChangePercent}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Ganancia neta"
          value={m.netProfit}
          change={m.profitChangePercent}
          icon={DollarSign}
        />
        <MetricCard
          title="ROAS real"
          value={m.trueRoas}
          valueIsCurrency={false}
          suffix="x"
          change={m.roasChangePercent}
          icon={Target}
        />
        <MetricCard
          title="Margen %"
          value={m.marginPercent}
          valueIsCurrency={false}
          suffix="%"
          change={m.marginChangePercent}
          icon={Percent}
          progress={Math.min(100, Math.max(0, m.marginPercent))}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Órdenes"
          value={m.orderCount}
          valueIsCurrency={false}
          decimals={0}
          change={m.orderCountChangePercent}
          icon={Package}
        />
        <MetricCard
          title="Ticket promedio"
          value={m.aov}
          change={m.aovChangePercent}
          icon={Receipt}
        />
        <MetricCard
          title="Gasto en ads (atribuido)"
          value={m.adSpendAttributed}
          change={m.adSpendChangePercent}
          icon={Wallet}
          integrationBrand="meta"
        />
        <MetricCard
          title="MER (ventas / ads)"
          value={m.mer}
          valueIsCurrency={false}
          suffix="×"
          change={m.merChangePercent}
          icon={BarChart3}
        />
      </div>
      <div className="mt-8 space-y-8">
        <RevenueChart data={chartSeries} dateRange={dateRange} rangeLabel={rangeDisplayLabel} />
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Órdenes recientes</h2>
          <OrdersTable orders={filteredOrders} />
        </div>
        <AIAdvisor insights={advisorInsights} />
      </div>
    </>
  );
}
