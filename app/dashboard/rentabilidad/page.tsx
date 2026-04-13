"use client";

import { useMemo } from "react";
import { Area, ComposedChart, Pie, PieChart, Cell } from "recharts";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  ChartContainer,
  chartGrid,
  MargifyTooltip,
  MargifyXAxis,
  MargifyYAxis,
} from "@/components/ui/Chart";
import { DataTable, type Column } from "@/components/ui/Table";
import { Header } from "@/components/ui/Header";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { costTotalsFromOrders } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { getDashboardMetrics, mockUser, channelProfitRows, ordersLast30DaysSeries } from "@/lib/mock-data";
import { filterSeriesByRange } from "@/lib/dashboard-filters";
import { DollarSign, Percent, ShoppingBag, Target } from "lucide-react";

const PIE_COLORS = ["#64DFDF", "#ffffff", "#888888", "#444444", "#64DFDF99"];

export default function RentabilidadPage() {
  const { dateRange, setDateRange, filteredOrders } = useDashboard();
  const m = getDashboardMetrics(filteredOrders);

  const areaData = useMemo(() => {
    const series = ordersLast30DaysSeries();
    const slice = filterSeriesByRange(series, dateRange);
    return slice.map((d) => {
      const ventas = d.ventas;
      const ganancia = d.ganancia;
      const ads = d.ads;
      const costos = ventas - ganancia;
      return { ...d, ventas, costos, ganancia };
    });
  }, [dateRange]);

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

  const channelRows = useMemo(() => {
    return channelProfitRows().map((r, i) => ({
      id: `ch-${i}`,
      canal: r.channel,
      ventas: r.sales,
      costos: r.costs,
      ganancia: r.profit,
      margen: r.margin_percent,
    }));
  }, []);

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
    { key: "canal", header: "Canal", sortable: true },
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
      <Header
        userName={mockUser.full_name}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
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

      <Card className="mt-8">
        <CardTitle>Comparativa diaria</CardTitle>
        <CardDescription>Ventas brutas, costos totales y ganancia neta.</CardDescription>
        <div className="mt-4 h-72 md:h-80">
          <ChartContainer>
            <ComposedChart data={areaData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              {chartGrid}
              <MargifyXAxis dataKey="date" />
              <MargifyYAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={44} />
              <MargifyTooltip />
              <Area
                type="monotone"
                dataKey="ventas"
                name="Ventas brutas"
                stroke="#ffffff"
                fill="#ffffff22"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="costos"
                name="Costos totales"
                stroke="#888888"
                fill="#88888822"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="ganancia"
                name="Ganancia neta"
                stroke="#64DFDF"
                fill="#64DFDF22"
                strokeWidth={2}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Desglose de costos</CardTitle>
          <CardDescription>Distribución aproximada según tus órdenes importadas.</CardDescription>
          <div className="mt-4 h-64">
            <ChartContainer className="h-64">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {pie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <MargifyTooltip />
              </PieChart>
            </ChartContainer>
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
                    <td className="py-2 text-margify-text">{r.concepto}</td>
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
        <h2 className="mb-4 text-lg font-semibold text-white">Rentabilidad por canal</h2>
        <DataTable columns={cols} data={channelRows} pageSize={6} />
      </div>
    </>
  );
}
