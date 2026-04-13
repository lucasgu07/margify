"use client";

import { useMemo } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { CashflowPredictor } from "@/components/dashboard/CashflowPredictor";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Header } from "@/components/ui/Header";
import { buildCashflowEntries, cashflowSummary, mockUser } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

type Row = ReturnType<typeof buildCashflowEntries>[number] & { id: string };

export default function CashflowPage() {
  const { dateRange, setDateRange } = useDashboard();
  const entries = useMemo(() => buildCashflowEntries(), []);
  const summary = useMemo(() => cashflowSummary(), []);

  const byWeek = useMemo(() => {
    const map = new Map<string, { mp: number; card: number; cash: number }>();
    for (const e of entries) {
      const d = new Date(e.estimated_payout_date);
      const ws = startOfWeek(d);
      const key = ws.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { mp: 0, card: 0, cash: 0 });
      const b = map.get(key)!;
      if (e.payment_method === "Mercado Pago") b.mp += e.amount;
      else if (e.payment_method === "Tarjeta") b.card += e.amount;
      else b.cash += e.amount;
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([week, v]) => ({
        week,
        label: `Semana del ${formatDate(week, "short")}`,
        ...v,
        total: v.mp + v.card + v.cash,
      }));
  }, [entries]);

  const cols: Column<Row>[] = [
    {
      key: "sale_date",
      header: "Fecha de venta",
      sortable: true,
      accessor: (r) => r.sale_date,
      render: (r) => formatDate(r.sale_date, "short"),
    },
    {
      key: "amount",
      header: "Monto",
      sortable: true,
      accessor: (r) => r.amount,
      render: (r) => formatCurrency(r.amount),
    },
    { key: "payment_method", header: "Medio de pago", sortable: true },
    {
      key: "estimated_payout_date",
      header: "Cobro estimado",
      sortable: true,
      accessor: (r) => r.estimated_payout_date,
      render: (r) => formatDate(r.estimated_payout_date, "short"),
    },
    { key: "status", header: "Estado", sortable: true },
  ];

  const max = Math.max(...byWeek.map((w) => w.total), 1);

  return (
    <>
      <Header
        userName={mockUser.full_name}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
      <h1 className="mb-6 text-2xl font-bold text-white">¿Cuándo vas a cobrar?</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Timeline de cobros proyectados</CardTitle>
          <CardDescription>Agrupado por semana y medio de pago.</CardDescription>
          <div className="mt-6 space-y-6">
            {byWeek.map((w) => (
              <div key={w.week}>
                <p className="mb-2 text-xs font-medium text-margify-muted">{w.label}</p>
                <div className="flex h-10 gap-1 overflow-hidden rounded-control bg-margify-cardAlt">
                  <div
                    className="flex items-center justify-center bg-margify-cyan/80 text-[10px] font-semibold text-black"
                    style={{ width: `${(w.mp / max) * 100}%` }}
                    title="Mercado Pago"
                  >
                    {w.mp > max * 0.08 ? "MP" : ""}
                  </div>
                  <div
                    className="flex items-center justify-center bg-margify-cyan/40 text-[10px] font-semibold text-black"
                    style={{ width: `${(w.card / max) * 100}%` }}
                    title="Tarjeta"
                  >
                    {w.card > max * 0.08 ? "TC" : ""}
                  </div>
                  <div
                    className="flex items-center justify-center bg-margify-cyan/20 text-[10px] font-semibold text-margify-text"
                    style={{ width: `${(w.cash / max) * 100}%` }}
                    title="Efectivo"
                  >
                    {w.cash > max * 0.08 ? "EF" : ""}
                  </div>
                </div>
                <p className="mt-1 text-xs text-margify-muted">
                  Total semana: {formatCurrency(w.total)} · MP {formatCurrency(w.mp)} · Tarjeta{" "}
                  {formatCurrency(w.card)} · Efectivo {formatCurrency(w.cash)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <CashflowPredictor
          thisWeek={summary.thisWeek}
          nextWeek={summary.nextWeek}
          month={summary.month}
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Detalle</h2>
        <DataTable columns={cols} data={entries as Row[]} pageSize={8} searchable />
      </div>
    </>
  );
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
