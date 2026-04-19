"use client";

import { useMemo, useState } from "react";
import { buildRentabilidadAdvisorInsights } from "@/lib/ai-advisor-insights";
import { Pie, PieChart, Cell } from "recharts";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import {
  ComparativaDiariaChart,
  type ComparativaDiariaRow,
} from "@/components/dashboard/ComparativaDiariaChart";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { ChartContainer, MargifyTooltip } from "@/components/ui/Chart";
import { DataTable, type Column } from "@/components/ui/Table";
import { Header } from "@/components/ui/Header";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { costTotalsFromOrders } from "@/lib/calculations";
import { cn, formatCurrency } from "@/lib/utils";
import { getDashboardMetrics, channelProfitRows } from "@/lib/mock-data";
import { DollarSign, Percent, ShoppingBag, Wallet } from "lucide-react";
import {
  IntegrationBrandIcon,
  IntegrationBrandStack,
  orderChannelToBrandId,
} from "@/components/ui/IntegrationBrandIcon";
import type { OrderChannel } from "@/types";

const PIE_COLORS = ["#64DFDF", "#ffffff", "#888888", "#444444", "#64DFDF99"];

export default function RentabilidadPage() {
  const { full_name } = useDashboardIdentity();
  const { dateRange, setDateRange, filteredOrders, chartSeries, storeScope } = useDashboard();
  const m = getDashboardMetrics(filteredOrders, storeScope === "all" ? null : storeScope);
  const [pieHidden, setPieHidden] = useState<Record<string, boolean>>({});

  const areaData = useMemo((): ComparativaDiariaRow[] => {
    return chartSeries.map((d) => {
      const ventas = d.ventas;
      const ganancia = d.ganancia;
      const costos = ventas - ganancia;
      return {
        date: d.date,
        labelTooltip: d.labelTooltip,
        ventas,
        costos,
        ganancia,
      };
    });
  }, [chartSeries]);

  const pie = useMemo(() => {
    const t = costTotalsFromOrders(filteredOrders);
    const agency = 0;
    return [
      { name: "Costo de producto", value: Math.round(t.product) },
      { name: "Comisiones de pago", value: Math.round(t.payment) },
      { name: "Costo de envío", value: Math.round(t.shipping) },
      { name: "Gasto en publicidad", value: Math.round(t.ads) },
      { name: "Fee de agencia", value: Math.round(agency) },
    ].filter((x) => x.value > 0);
  }, [filteredOrders]);

  const visiblePie = useMemo(
    () => pie.filter((p) => !pieHidden[p.name]),
    [pie, pieHidden]
  );

  const totalSales = useMemo(
    () => filteredOrders.reduce((a, o) => a + o.revenue, 0),
    [filteredOrders]
  );

  const advisorInsights = useMemo(
    () => buildRentabilidadAdvisorInsights(filteredOrders),
    [filteredOrders]
  );

  const channelRows = useMemo(() => {
    return channelProfitRows(filteredOrders).map((r, i) => ({
      id: `ch-${i}`,
      canal: r.channel,
      ventas: r.sales,
      costos: r.costs,
      ganancia: r.profit,
      margen: r.margin_percent,
    }));
  }, [filteredOrders]);

  const costTableRows = useMemo(() => {
    const t = costTotalsFromOrders(filteredOrders);
    const totalSales = filteredOrders.reduce((a, o) => a + o.revenue, 0);
    const rows = [
      { id: "c1", concepto: "Costo de producto", monto: t.product },
      { id: "c2", concepto: "Comisiones de pago", monto: t.payment },
      { id: "c3", concepto: "Costo de envío", monto: t.shipping },
      { id: "c4", concepto: "Gasto en publicidad", monto: t.ads },
      { id: "c5", concepto: "Fee de agencia", monto: 0 },
    ];
    return rows.map((r) => ({
      ...r,
      pct: totalSales > 0 ? (r.monto / totalSales) * 100 : 0,
    }));
  }, [filteredOrders]);

  const cols: Column<(typeof channelRows)[number]>[] = [
    {
      key: "canal",
      header: "Canal",
      sortable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <IntegrationBrandIcon brand={orderChannelToBrandId(r.canal as OrderChannel)} size="xs" />
          <span>{r.canal}</span>
        </span>
      ),
    },
    {
      key: "ventas",
      header: "Ventas",
      sortable: true,
      accessor: (r) => r.ventas,
      render: (r) => formatCurrency(r.ventas),
    },
    {
      key: "costos",
      header: "Costos",
      sortable: true,
      accessor: (r) => r.costos,
      render: (r) => formatCurrency(r.costos),
    },
    {
      key: "ganancia",
      header: "Ganancia",
      sortable: true,
      accessor: (r) => r.ganancia,
      render: (r) => (
        <span className={r.ganancia >= 0 ? "text-margify-cyan" : "text-margify-negative"}>
          {formatCurrency(r.ganancia)}
        </span>
      ),
    },
    {
      key: "margen",
      header: "Margen %",
      sortable: true,
      accessor: (r) => r.margen,
      render: (r) => `${r.margen.toFixed(1)}%`,
    },
  ];

  return (
    <>
      <Header userName={full_name} />
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
          title="Gasto en ads (atribuido)"
          value={m.adSpendAttributed}
          change={m.adSpendChangePercent}
          icon={Wallet}
          integrationBrand="meta"
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

      <Card className="mt-8">
        <CardTitle>Comparativa diaria</CardTitle>
        <CardDescription>Ventas brutas, costos totales y ganancia neta.</CardDescription>
        <div className="mt-4">
          <ComparativaDiariaChart data={areaData} dateRange={dateRange} />
        </div>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Desglose de costos</CardTitle>
          <CardDescription>
            Distribución aproximada según tus órdenes importadas. Tocá cada concepto para mostrarlo u
            ocultarlo en el gráfico.
          </CardDescription>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-stretch">
            <div className="flex shrink-0 flex-col gap-2 sm:w-[42%] sm:max-w-xs sm:pr-2">
              {pie.map((p, i) => {
                const color = PIE_COLORS[i % PIE_COLORS.length];
                const off = pieHidden[p.name];
                const pctVentas =
                  totalSales > 0 ? (p.value / totalSales) * 100 : 0;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      setPieHidden((h) => ({
                        ...h,
                        [p.name]: !h[p.name],
                      }))
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-control border border-transparent px-2 py-1.5 text-left text-sm transition-all duration-margify",
                      "hover:border-margify-border hover:bg-margify-cardAlt/50",
                      off ? "opacity-45" : "text-margify-text"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/10"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2 leading-snug",
                        off ? "text-margify-muted line-through" : "text-margify-text"
                      )}
                    >
                      {p.name === "Gasto en publicidad" ? (
                        <IntegrationBrandStack brands={["meta", "googleAds", "tiktok"]} size="xs" />
                      ) : null}
                      {p.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 tabular-nums text-xs font-medium",
                        off ? "text-margify-muted line-through" : "text-margify-cyan/90"
                      )}
                    >
                      {pctVentas.toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="min-h-[16rem] min-w-0 flex-1">
              {visiblePie.length > 0 ? (
                <ChartContainer className="h-64">
                  <PieChart>
                    <Pie
                      data={visiblePie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      animationDuration={500}
                      animationEasing="ease-out"
                    >
                      {visiblePie.map((slice) => {
                        const idx = pie.findIndex((x) => x.name === slice.name);
                        return (
                          <Cell
                            key={slice.name}
                            fill={PIE_COLORS[(idx >= 0 ? idx : 0) % PIE_COLORS.length]}
                          />
                        );
                      })}
                    </Pie>
                    <MargifyTooltip />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-control border border-dashed border-margify-border text-sm text-margify-muted">
                  Elegí al menos un concepto para ver el gráfico.
                </div>
              )}
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle>Detalle en tabla</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-margify-muted">
                <tr>
                  <th className="pb-2 text-left font-medium">Concepto</th>
                  <th className="pb-2 text-right font-medium">Monto</th>
                  <th className="pb-2 text-right font-medium">% / ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-margify-border">
                {costTableRows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 text-margify-text">
                      {r.concepto === "Gasto en publicidad" ? (
                        <span className="inline-flex items-center gap-2">
                          <IntegrationBrandStack brands={["meta", "googleAds", "tiktok"]} size="xs" />
                          {r.concepto}
                        </span>
                      ) : (
                        r.concepto
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(r.monto)}</td>
                    <td className="py-2 text-right tabular-nums text-margify-muted">
                      {r.pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 flex flex-wrap items-center gap-2 text-lg font-semibold text-white">
          Rentabilidad por canal
          <span className="inline-flex items-center gap-1 text-xs font-normal text-margify-muted">
            <IntegrationBrandIcon brand="tiendanube" size="xs" />
            <IntegrationBrandIcon brand="mercadolibre" size="xs" />
            <IntegrationBrandIcon brand="shopify" size="xs" />
          </span>
        </h2>
        <DataTable columns={cols} data={channelRows} pageSize={6} />
      </div>

      <div className="mt-10">
        <AIAdvisor insights={advisorInsights} />
      </div>
    </>
  );
}
