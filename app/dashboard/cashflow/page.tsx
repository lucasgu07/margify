"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  CalendarClock,
  Download,
  Landmark,
  Link2,
  Percent,
  Wallet,
} from "lucide-react";
import { buildCashflowAdvisorInsights } from "@/lib/ai-advisor-insights";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import { CashflowPendingDonutSection } from "@/components/dashboard/CashflowDashboardCharts";
import { CashflowPredictor } from "@/components/dashboard/CashflowPredictor";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Header } from "@/components/ui/Header";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  buildCashflowTableRows,
  cashflowSummary,
  mockUser,
} from "@/lib/mock-data";
import type { CashflowTableRow } from "@/types";
import { IntegrationBrandIcon, orderChannelToBrandId } from "@/components/ui/IntegrationBrandIcon";
import type { OrderChannel } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";

function channelShort(ch: CashflowTableRow["origin"]): string {
  if (ch === "TiendaNube") return "Tienda Nube";
  if (ch === "MercadoLibre") return "Mercado Libre";
  return "Shopify";
}

function downloadCsv(rows: CashflowTableRow[]) {
  const headers = [
    "ID Orden",
    "Fecha creación",
    "Fecha pago est.",
    "Estado",
    "Total orden",
    "Liquidable",
    "Comisión",
    "Origen",
    "Gateway",
    "Cuotas",
  ];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        esc(r.order_external_id),
        esc(r.sale_date),
        esc(r.payout_date),
        esc(r.status),
        r.total_order,
        r.liquidable,
        r.comision,
        esc(channelShort(r.origin)),
        esc(r.gateway),
        r.cuotas,
      ].join(",")
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `margify-cashflow-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: CashflowTableRow["status"] }) {
  const styles =
    status === "Cobrado"
      ? "bg-margify-cyan/15 text-margify-cyan"
      : status === "Pendiente"
        ? "bg-margify-border text-margify-muted"
        : "bg-margify-card text-margify-muted ring-1 ring-margify-border";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles)}>
      {status}
    </span>
  );
}

export default function CashflowPage() {
  const { filteredOrders, rangeDisplayLabel, storeScope, connectedStores } = useDashboard();
  const [filterOrderId, setFilterOrderId] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterGateway, setFilterGateway] = useState("");
  /** Cobro: pendientes incluye Pendiente + En proceso; cobrados solo Cobrado. */
  const [filterCobro, setFilterCobro] = useState<"todos" | "pendientes" | "cobrados">("todos");

  const rows = useMemo(() => buildCashflowTableRows(filteredOrders), [filteredOrders]);

  const entriesForSummary = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        sale_date: r.sale_date,
        amount: r.total_order,
        payment_method: r.payment_method,
        estimated_payout_date: r.payout_date,
        status: r.status,
      })),
    [rows]
  );

  const summary = useMemo(() => cashflowSummary(entriesForSummary), [entriesForSummary]);

  const kpis = useMemo(() => {
    let ventas = 0;
    let liquidable = 0;
    let comisiones = 0;
    let pendientes = 0;
    let recibidos = 0;
    for (const r of rows) {
      ventas += r.total_order;
      liquidable += r.liquidable;
      comisiones += r.comision;
      if (r.status === "Cobrado") recibidos += r.total_order;
      else pendientes += r.total_order;
    }
    const comisionPct = ventas > 0 ? (comisiones / ventas) * 100 : 0;
    return { ventas, liquidable, comisiones, pendientes, recibidos, comisionPct };
  }, [rows]);

  const storeContextLine = useMemo(() => {
    if (storeScope === "all") {
      return "Los montos incluyen todas las tiendas conectadas.";
    }
    const label = connectedStores.find((s) => s.id === storeScope)?.label;
    return label
      ? `Los montos son solo de esta tienda: ${label}.`
      : "Los montos corresponden a la tienda seleccionada en el encabezado.";
  }, [storeScope, connectedStores]);

  const pendingDonut = useMemo(() => {
    let total = 0;
    const byName = new Map<string, number>();
    for (const r of rows) {
      if (r.status === "Cobrado") continue;
      const key = r.origin === "MercadoLibre" ? "Mercado Libre" : "Mercado Pago";
      const add = r.total_order;
      total += add;
      byName.set(key, (byName.get(key) ?? 0) + add);
    }
    const slices = [
      { name: "Mercado Libre", value: byName.get("Mercado Libre") ?? 0 },
      { name: "Mercado Pago", value: byName.get("Mercado Pago") ?? 0 },
    ];
    return { slices, totalPending: total };
  }, [rows]);

  const filteredTableRows = useMemo(() => {
    const qId = filterOrderId.trim().toLowerCase();
    const qO = filterOrigin.trim().toLowerCase();
    const qG = filterGateway.trim().toLowerCase();
    return rows.filter((r) => {
      if (qId && !r.order_external_id.toLowerCase().includes(qId)) return false;
      if (qO && !channelShort(r.origin).toLowerCase().includes(qO) && !r.origin.toLowerCase().includes(qO))
        return false;
      if (qG && !r.gateway.toLowerCase().includes(qG)) return false;
      if (filterCobro === "cobrados" && r.status !== "Cobrado") return false;
      if (filterCobro === "pendientes" && r.status === "Cobrado") return false;
      return true;
    });
  }, [rows, filterOrderId, filterOrigin, filterGateway, filterCobro]);

  const advisorInsights = useMemo(
    () => buildCashflowAdvisorInsights(filteredOrders),
    [filteredOrders]
  );

  const cols: Column<CashflowTableRow>[] = [
    {
      key: "order_external_id",
      header: "ID Orden",
      sortable: true,
      accessor: (r) => r.order_external_id,
    },
    {
      key: "sale_date",
      header: "Fecha creación",
      sortable: true,
      accessor: (r) => r.sale_date,
      render: (r) => r.sale_date,
    },
    {
      key: "payout_date",
      header: "Fecha pago",
      sortable: true,
      accessor: (r) => r.payout_date,
      render: (r) => r.payout_date,
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "total_order",
      header: "Total orden",
      sortable: true,
      accessor: (r) => r.total_order,
      render: (r) => formatCurrency(r.total_order),
    },
    {
      key: "liquidable",
      header: "Liquidable",
      sortable: true,
      accessor: (r) => r.liquidable,
      render: (r) => formatCurrency(r.liquidable),
    },
    {
      key: "origin",
      header: "Origen",
      sortable: true,
      accessor: (r) => r.origin,
      render: (r) => (
        <span className="inline-flex items-center gap-2 text-margify-text" title={r.origin}>
          <IntegrationBrandIcon brand={orderChannelToBrandId(r.origin as OrderChannel)} size="xs" />
          {channelShort(r.origin)}
        </span>
      ),
    },
    {
      key: "gateway",
      header: "Gateway",
      sortable: true,
      accessor: (r) => r.gateway,
      render: (r) => <span className="text-margify-text">{r.gateway}</span>,
    },
    {
      key: "cuotas",
      header: "Cuotas",
      sortable: true,
      accessor: (r) => r.cuotas,
    },
  ];

  const filterSlot = (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <input
          placeholder="Filtrar por ID orden…"
          value={filterOrderId}
          onChange={(e) => setFilterOrderId(e.target.value)}
          className="w-full min-w-[10rem] rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text outline-none transition-[border] duration-margify focus:border-margify-cyan sm:max-w-[11rem]"
          aria-label="Filtrar por ID de orden"
        />
        <input
          placeholder="Filtrar por origen…"
          value={filterOrigin}
          onChange={(e) => setFilterOrigin(e.target.value)}
          className="w-full min-w-[10rem] rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text outline-none transition-[border] duration-margify focus:border-margify-cyan sm:max-w-[11rem]"
          aria-label="Filtrar por canal de origen"
        />
        <input
          placeholder="Filtrar por gateway…"
          value={filterGateway}
          onChange={(e) => setFilterGateway(e.target.value)}
          className="w-full min-w-[10rem] rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text outline-none transition-[border] duration-margify focus:border-margify-cyan sm:max-w-[11rem]"
          aria-label="Filtrar por gateway de cobro"
        />
        <button
          type="button"
          onClick={() => downloadCsv(filteredTableRows)}
          className="inline-flex items-center justify-center gap-2 rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm font-medium text-margify-text transition-colors duration-margify hover:border-margify-cyan/50 hover:text-margify-cyan"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          Exportar CSV
        </button>
      </div>
      <div className="flex flex-col gap-2 border-t border-margify-border pt-3 sm:flex-row sm:items-center sm:justify-end">
        <label htmlFor="cashflow-cobro-filter" className="text-sm text-margify-muted">
          Estado de cobro
        </label>
        <select
          id="cashflow-cobro-filter"
          value={filterCobro}
          onChange={(e) =>
            setFilterCobro(e.target.value as "todos" | "pendientes" | "cobrados")
          }
          className="w-full min-w-[12rem] rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text outline-none transition-[border] duration-margify focus:border-margify-cyan sm:max-w-xs"
        >
          <option value="todos">Todos</option>
          <option value="pendientes">Pagos pendientes (incl. en proceso)</option>
          <option value="cobrados">Ya cobrados</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      <Header userName={mockUser.full_name} />
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-white">Cashflow</h1>
        <p className="text-sm text-margify-muted">
          Período: {rangeDisplayLabel}. {storeContextLine} Cambiá fechas y tienda desde el encabezado.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <MetricCard title="Ventas" value={kpis.ventas} icon={Wallet} compact />
        <MetricCard title="Liquidable (ventas)" value={kpis.liquidable} icon={Landmark} compact />
        <MetricCard title="Comisiones de pago" value={kpis.comisiones} icon={Link2} compact />
        <MetricCard title="Pagos pendientes" value={kpis.pendientes} icon={CalendarClock} compact />
        <MetricCard title="Pagos recibidos" value={kpis.recibidos} icon={ArrowDownToLine} compact />
        <MetricCard
          title="Comisiones % / ventas"
          value={kpis.comisionPct}
          valueIsCurrency={false}
          suffix="%"
          icon={Percent}
          decimals={2}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <CashflowPendingDonutSection
          slices={pendingDonut.slices}
          totalPending={pendingDonut.totalPending}
        />
        <CashflowPredictor
          thisWeek={summary.thisWeek}
          nextWeek={summary.nextWeek}
          month={summary.month}
        />
      </div>

      <div className="mt-10">
        <Card className="border-margify-border bg-margify-cardAlt">
          <CardTitle>Detalle de órdenes</CardTitle>
          <CardDescription>
            Filtros solo para esta tabla. Ordená por columna con el ícono junto al encabezado.
          </CardDescription>
          <div className="mt-4 min-w-0">
            <DataTable
              columns={cols}
              data={filteredTableRows}
              pageSize={10}
              filterSlot={filterSlot}
            />
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <AIAdvisor insights={advisorInsights} />
      </div>
    </>
  );
}
