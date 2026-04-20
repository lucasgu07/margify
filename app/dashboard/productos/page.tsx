"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListFilter } from "lucide-react";
import { buildProductosAdvisorInsights } from "@/lib/ai-advisor-insights";
import { AIAdvisor } from "@/components/dashboard/AIAdvisor";
import { ProductFiltersFields } from "@/components/dashboard/ProductFiltersFields";
import { ShopifyProductsTable } from "@/components/dashboard/ShopifyProductsTable";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Header } from "@/components/ui/Header";
import { Input } from "@/components/ui/Input";
import {
  DEFAULT_PRODUCT_FILTERS,
  filterAndSortProducts,
  type ProductFilterState,
} from "@/lib/product-filters";
import { buildProductProfits } from "@/lib/mock-data";
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
  const { full_name } = useDashboardIdentity();
  const { filteredOrders } = useDashboard();
  const [products, setProducts] = useState<ProductProfit[]>(() =>
    buildProductProfits(filteredOrders)
  );

  const [filtersCards, setFiltersCards] = useState<ProductFilterState>(DEFAULT_PRODUCT_FILTERS);
  const [filtersTable, setFiltersTable] = useState<ProductFilterState>(DEFAULT_PRODUCT_FILTERS);
  const [openCards, setOpenCards] = useState(false);
  const [openTable, setOpenTable] = useState(false);

  useEffect(() => {
    setProducts(buildProductProfits(filteredOrders));
  }, [filteredOrders]);

  const displayedCards = useMemo(
    () => filterAndSortProducts(products, filtersCards),
    [products, filtersCards]
  );

  const displayedTable = useMemo(
    () => filterAndSortProducts(products, filtersTable),
    [products, filtersTable]
  );

  const worst = useMemo(
    () =>
      [...displayedTable].sort((a, b) => a.margin_percent - b.margin_percent).slice(0, 4),
    [displayedTable]
  );

  const advisorInsights = useMemo(
    () => buildProductosAdvisorInsights(filteredOrders),
    [filteredOrders]
  );

  const tableRows = useMemo<ProductRow[]>(
    () =>
      displayedTable.map((p) => ({
        ...p,
        costo_edit: p.total_cost,
        precio_edit: p.revenue,
      })),
    [displayedTable]
  );

  const updateCards = useCallback(<K extends keyof ProductFilterState>(
    key: K,
    value: ProductFilterState[K]
  ) => {
    setFiltersCards((f) => ({ ...f, [key]: value }));
  }, []);

  const updateTable = useCallback(<K extends keyof ProductFilterState>(
    key: K,
    value: ProductFilterState[K]
  ) => {
    setFiltersTable((f) => ({ ...f, [key]: value }));
  }, []);

  const cols: Column<ProductRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Producto",
        sortable: true,
        render: (r) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-control bg-margify-cardAlt text-xs text-margify-muted">
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
    ],
    []
  );

  return (
    <>
      <Header userName={full_name} />

      <section className="mb-10 min-w-0">
        <ShopifyProductsTable hideWhenDisconnected />
      </section>

      {/* max-md: 3 filas — título | filtro | tarjetas (+ card de filtros si aplica). md+: como antes. */}
      <div className="max-md:flex max-md:flex-col max-md:gap-4">
        <div className="mb-6 flex flex-wrap items-center gap-3 max-md:mb-0 max-md:flex-col max-md:items-stretch max-md:gap-3 md:flex-row md:items-center">
          <h1 className="text-2xl font-bold text-white max-md:w-full">Rentabilidad por producto</h1>
          <button
            type="button"
            onClick={() => setOpenCards((o) => !o)}
            className={cn(
              "rounded-control border p-2 transition-colors duration-margify max-md:w-fit max-md:self-start",
              openCards
                ? "border-margify-cyan bg-margify-cyan/10 text-margify-cyan"
                : "border-margify-border bg-margify-cardAlt text-margify-muted hover:border-margify-cyan hover:text-margify-cyan"
            )}
            title={openCards ? "Ocultar filtros de las tarjetas" : "Filtrar y ordenar tarjetas"}
            aria-expanded={openCards}
          >
            <ListFilter className="h-5 w-5" aria-hidden />
          </button>
        </div>

      {openCards ? (
        <Card className="mb-6 border-margify-border bg-margify-cardAlt/40 max-md:mb-0">
          <CardTitle className="text-base text-white">Filtros — vista en tarjetas</CardTitle>
          <CardDescription className="text-margify-muted">
            Solo afecta la grilla de arriba.{" "}
            <span className="text-margify-text/80">
              Mostrando {displayedCards.length} de {products.length} productos.
            </span>
          </CardDescription>
          <ProductFiltersFields
            idPrefix="pf-cards"
            filters={filtersCards}
            onUpdate={updateCards}
            onReset={() => setFiltersCards(DEFAULT_PRODUCT_FILTERS)}
          />
        </Card>
      ) : null}

      <div className="grid grid-cols-1 max-md:grid-cols-3 max-md:gap-2 gap-4 md:grid-cols-2 xl:grid-cols-3 max-md:mt-0">
        {displayedCards.length === 0 ? (
          <p className="col-span-full text-sm text-margify-muted">
            Ningún producto coincide con los filtros de las tarjetas. Probá relajar criterios.
          </p>
        ) : (
          displayedCards.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "flex flex-col gap-3",
                "max-md:gap-1.5 max-md:p-2 max-md:hover:shadow-lg"
              )}
            >
              <div className="flex gap-4 max-md:flex-col max-md:gap-1.5 max-md:items-center">
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center overflow-hidden rounded-control bg-margify-cardAlt text-margify-muted",
                    "h-16 w-16 text-xs",
                    "max-md:h-8 max-md:w-full max-md:max-w-[2.75rem] max-md:text-[0.5rem] max-md:leading-none"
                  )}
                >
                  Sin imagen
                </div>
                <div className="min-w-0 flex-1 max-md:text-center">
                  <p
                    className={cn(
                      "truncate font-semibold text-white",
                      "max-md:line-clamp-2 max-md:min-h-[1.75rem] max-md:text-[0.65rem] max-md:leading-tight"
                    )}
                  >
                    {p.name}
                  </p>
                  <p className="text-xs text-margify-muted max-md:text-[0.55rem] max-md:leading-tight">
                    {p.units_sold} u.
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex items-end justify-between gap-2",
                  "max-md:flex-col max-md:items-stretch max-md:gap-1 max-md:pt-0.5"
                )}
              >
                <div>
                  <p className="text-xs text-margify-muted max-md:hidden">Ganancia total</p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      p.profit >= 0 ? "text-margify-cyan" : "text-margify-negative",
                      "max-md:text-[0.65rem] max-md:leading-tight"
                    )}
                  >
                    {formatCurrency(p.profit)}
                  </p>
                </div>
                <div className="text-right max-md:text-left">
                  <p className="text-xs text-margify-muted max-md:hidden">Margen</p>
                  <p className="text-lg font-bold text-white max-md:text-[0.65rem] max-md:leading-tight">
                    {p.margin_percent.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "h-2 overflow-hidden rounded-full bg-margify-border",
                  "max-md:h-1"
                )}
              >
                <div
                  className={cn("h-full rounded-full", marginColor(p.margin_percent))}
                  style={{ width: `${Math.min(100, Math.max(0, p.margin_percent))}%` }}
                />
              </div>
            </Card>
          ))
        )}
      </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-white">Ajuste fino por SKU</h2>
        <button
          type="button"
          onClick={() => setOpenTable((o) => !o)}
          className={cn(
            "rounded-control border p-2 transition-colors duration-margify",
            openTable
              ? "border-margify-cyan bg-margify-cyan/10 text-margify-cyan"
              : "border-margify-border bg-margify-cardAlt text-margify-muted hover:border-margify-cyan hover:text-margify-cyan"
          )}
          title={openTable ? "Ocultar filtros de la tabla" : "Filtrar y ordenar solo la tabla"}
          aria-expanded={openTable}
        >
          <ListFilter className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {openTable ? (
        <Card className="mt-4 border-margify-border bg-margify-cardAlt/40">
          <CardTitle className="text-base text-white">Filtros — tabla Ajuste fino por SKU</CardTitle>
          <CardDescription className="text-margify-muted">
            Solo afecta la tabla de abajo y el bloque de peores márgenes.{" "}
            <span className="text-margify-text/80">
              Mostrando {displayedTable.length} de {products.length} productos.
            </span>
          </CardDescription>
          <ProductFiltersFields
            idPrefix="pf-table"
            filters={filtersTable}
            onUpdate={updateTable}
            onReset={() => setFiltersTable(DEFAULT_PRODUCT_FILTERS)}
          />
        </Card>
      ) : null}

      <div className="mt-4 min-w-0">
        <DataTable columns={cols} data={tableRows} pageSize={6} />
      </div>

      <Card className="mt-10 border-margify-negative/30 bg-margify-negative/5">
        <CardTitle className="text-margify-negative">Estos productos están destruyendo tu margen</CardTitle>
        <CardDescription>
          Peores performers por margen % según los filtros de la tabla (Ajuste fino por SKU).
        </CardDescription>
        <ul className="mt-4 space-y-2 text-sm text-margify-text">
          {worst.length === 0 ? (
            <li className="text-margify-muted">No hay datos con los filtros actuales de la tabla.</li>
          ) : (
            worst.map((p) => (
              <li
                key={p.id}
                className="flex justify-between gap-4 rounded-control border border-margify-border bg-margify-card px-3 py-2"
              >
                <span>{p.name}</span>
                <span className="text-margify-negative">{p.margin_percent.toFixed(1)}%</span>
              </li>
            ))
          )}
        </ul>
      </Card>

      <div className="mt-10">
        <AIAdvisor insights={advisorInsights} />
      </div>
    </>
  );
}
