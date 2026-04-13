"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Header } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import { buildProductProfits, mockUser } from "@/lib/mock-data";
import type { ProductProfit } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

function marginColor(m: number) {
  if (m > 30) return "bg-margify-cyan";
  if (m >= 15) return "bg-amber-400";
  return "bg-margify-negative";
}

type ProductRow = ProductProfit & { costo_edit: number; precio_edit: number };

export default function ProductosPage() {
  const { dateRange, setDateRange } = useDashboard();
  const base = useMemo(() => buildProductProfits(), []);
  const [products, setProducts] = useState<ProductProfit[]>(() => base);

  const worst = useMemo(
    () => [...products].sort((a, b) => a.margin_percent - b.margin_percent).slice(0, 4),
    [products]
  );

  const tableRows = useMemo<ProductRow[]>(
    () =>
      products.map((p) => ({
        ...p,
        costo_edit: p.total_cost,
        precio_edit: p.revenue,
      })),
    [products]
  );

  const cols: Column<ProductRow>[] = [
    {
      key: "name",
      header: "Producto",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-control bg-margify-cardAlt text-xs text-margify-muted">
            IMG
          </div>
          <span>{r.name}</span>
        </div>
      ),
    },
    {
      key: "units_sold",
      header: "Unidades",
      sortable: true,
      accessor: (r) => r.units_sold,
    },
    {
      key: "revenue",
      header: "Ingresos",
      sortable: true,
      accessor: (r) => r.revenue,
      render: (r) => formatCurrency(r.revenue),
    },
    {
      key: "costo_edit",
      header: "Costo total (editable)",
      sortable: false,
      render: (r) => (
        <Input
          className="max-w-[120px]"
          type="number"
          defaultValue={Math.round(r.total_cost)}
          onBlur={(e) => {
            const v = Number(e.target.value);
            setProducts((ps) =>
              ps.map((p) =>
                p.id === r.id
                  ? {
                      ...p,
                      total_cost: v,
                      profit: p.revenue - v,
                      margin_percent: p.revenue > 0 ? ((p.revenue - v) / p.revenue) * 100 : 0,
                    }
                  : p
              )
            );
          }}
        />
      ),
    },
    {
      key: "profit",
      header: "Ganancia",
      sortable: true,
      accessor: (r) => r.profit,
      render: (r) => (
        <span className={r.profit >= 0 ? "text-margify-cyan" : "text-margify-negative"}>
          {formatCurrency(r.profit)}
        </span>
      ),
    },
    {
      key: "margin_percent",
      header: "Margen %",
      sortable: true,
      accessor: (r) => r.margin_percent,
      render: (r) => `${r.margin_percent.toFixed(1)}%`,
    },
  ];

  return (
    <>
      <Header
        userName={mockUser.full_name}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
      <h1 className="mb-6 text-2xl font-bold text-white">Rentabilidad por producto</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="flex flex-col gap-3">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-control bg-margify-cardAlt text-xs text-margify-muted">
                Sin imagen
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{p.name}</p>
                <p className="text-xs text-margify-muted">{p.units_sold} u. vendidas</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs text-margify-muted">Ganancia total</p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    p.profit >= 0 ? "text-margify-cyan" : "text-margify-negative"
                  )}
                >
                  {formatCurrency(p.profit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-margify-muted">Margen</p>
                <p className="text-lg font-bold text-white">{p.margin_percent.toFixed(1)}%</p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-margify-border">
              <div
                className={cn("h-full rounded-full", marginColor(p.margin_percent))}
                style={{ width: `${Math.min(100, Math.max(0, p.margin_percent))}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Ajuste fino por SKU</h2>
        <DataTable columns={cols} data={tableRows} pageSize={6} searchable searchKeys={["name"]} />
      </div>

      <Card className="mt-10 border-margify-negative/30 bg-margify-negative/5">
        <CardTitle className="text-margify-negative">Estos productos están destruyendo tu margen</CardTitle>
        <CardDescription>Peores performers por margen % (demo).</CardDescription>
        <ul className="mt-4 space-y-2 text-sm text-margify-text">
          {worst.map((p) => (
            <li key={p.id} className="flex justify-between gap-4 rounded-control border border-margify-border bg-margify-card px-3 py-2">
              <span>{p.name}</span>
              <span className="text-margify-negative">{p.margin_percent.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
