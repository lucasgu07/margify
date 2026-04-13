"use client";

import { DollarSign, Percent, ShoppingBag, Target } from "lucide-react";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Header } from "@/components/ui/Header";
import { MetricCard } from "@/components/ui/MetricCard";
import { getDashboardMetrics, mockUser } from "@/lib/mock-data";

export function DashboardPageClient() {
  const { dateRange, setDateRange, filteredOrders, chartSeries } = useDashboard();
  const m = getDashboardMetrics(filteredOrders);

  return (
    <>
      <Header
        userName={mockUser.full_name}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showConnect
        onConnect={() => {
          window.location.href = "/dashboard/configuracion";
        }}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Ventas totales"
          value={m.totalSales}
          change={m.salesChangePercent}
          changeType={m.salesChangePercent >= 0 ? "positive" : "negative"}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Ganancia neta"
          value={m.netProfit}
          change={m.profitChangePercent}
          changeType={m.netProfit >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          valueClassName={m.netProfit >= 0 ? "text-margify-cyan" : "text-margify-negative"}
        />
        <MetricCard
          title="ROAS real"
          value={m.trueRoas}
          valueIsCurrency={false}
          suffix="x"
          change={m.roasChangePercent}
          changeType={m.roasChangePercent >= 0 ? "positive" : "negative"}
          icon={Target}
        />
        <MetricCard
          title="Margen %"
          value={m.marginPercent}
          valueIsCurrency={false}
          suffix="%"
          change={m.marginChangePercent}
          changeType={m.marginChangePercent >= 0 ? "positive" : "negative"}
          icon={Percent}
          progress={Math.min(100, Math.max(0, m.marginPercent))}
        />
      </div>
      <div className="mt-8 space-y-8">
        <RevenueChart data={chartSeries} />
        <AIAdvisor />
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Órdenes recientes</h2>
          <OrdersTable orders={filteredOrders} />
        </div>
      </div>
    </>
  );
}
