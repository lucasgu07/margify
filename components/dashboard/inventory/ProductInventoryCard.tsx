"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Edit3, Check, X } from "lucide-react";
import { StockLevelBar } from "@/components/dashboard/inventory/StockLevelBar";
import type { ProductInventoryIntel, StockRisk } from "@/lib/inventory/types";

// ─── Risk badge ───────────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: StockRisk }) {
  const config: Record<StockRisk, { label: string; className: string }> = {
    critical: { label: "Crítico", className: "bg-red-950/70 text-red-300 border-red-800/60" },
    warning: { label: "Advertencia", className: "bg-amber-950/60 text-amber-300 border-amber-800/50" },
    healthy: { label: "Saludable", className: "bg-emerald-950/50 text-emerald-300 border-emerald-800/40" },
    overstock: { label: "Sobrestock", className: "bg-blue-950/50 text-blue-300 border-blue-800/40" },
    dead: { label: "Muerto", className: "bg-white/5 text-white/40 border-white/10" },
    unknown: { label: "Sin datos", className: "bg-white/5 text-white/30 border-white/8" },
  };
  const c = config[risk];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-white/35">{label}</span>
      <span className={`text-[12px] font-semibold tabular-nums ${highlight ? "text-[#64DFDF]" : "text-white/70"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Inline stock editor ──────────────────────────────────────────────────────

function StockEditor({
  productName,
  currentStock,
  onSave,
}: {
  productName: string;
  currentStock: number;
  onSave: (name: string, qty: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentStock));

  function handleSave() {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty >= 0) {
      onSave(productName, qty);
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-white/25 transition hover:text-white/50"
        title="Editar stock"
      >
        <Edit3 className="h-3 w-3" />
        Editar stock
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        className="w-20 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-[#64DFDF]/40"
        autoFocus
      />
      <button type="button" onClick={handleSave} className="text-[#64DFDF]/70 hover:text-[#64DFDF]">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-white/30 hover:text-white/50">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type ProductInventoryCardProps = {
  product: ProductInventoryIntel;
  onStockUpdate: (productName: string, qty: number) => void;
};

// ─── Main card ────────────────────────────────────────────────────────────────

export function ProductInventoryCard({ product: p, onStockUpdate }: ProductInventoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const stockLabel =
    p.hasStockData
      ? `${p.currentStock} uds`
      : "Sin datos";

  const stockoutLabel =
    p.daysUntilStockout !== null
      ? p.daysUntilStockout <= 0
        ? "Sin stock"
        : `${p.daysUntilStockout}d`
      : "—";

  const velocityLabel = p.avgDailySales > 0
    ? `${p.avgDailySales.toFixed(1)} uds/día`
    : "Sin ventas";

  const marginColor =
    p.marginPercent > 25 ? "text-emerald-400"
    : p.marginPercent > 10 ? "text-amber-400"
    : "text-red-400";

  return (
    <div className="rounded-xl border border-white/8 bg-[#111111] transition-all hover:border-white/12">
      {/* ── Collapsed header ── */}
      <button
        type="button"
        className="w-full p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Name + badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-white">{p.productName}</span>
              <RiskBadge risk={p.risk} />
            </div>

            {/* Stock bar */}
            <div className="mt-2.5">
              <StockLevelBar
                currentStock={p.currentStock}
                reorderPoint={p.reorderPoint}
                risk={p.risk}
                compact
              />
            </div>

            {/* Quick stats row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-xs tabular-nums text-white/50">
                <span className="text-white/70">{stockLabel}</span>
              </span>
              {p.hasStockData && p.daysUntilStockout !== null && (
                <span className="text-xs text-white/40">
                  stockout en{" "}
                  <span
                    className={
                      p.risk === "critical"
                        ? "font-bold text-red-400"
                        : p.risk === "warning"
                        ? "font-semibold text-amber-400"
                        : "text-white/60"
                    }
                  >
                    {stockoutLabel}
                  </span>
                </span>
              )}
              <span className="text-xs text-white/40">
                <span className={`font-semibold ${marginColor}`}>
                  {p.marginPercent.toFixed(0)}%
                </span>{" "}
                margen
              </span>
              <span className="text-xs text-white/40">{velocityLabel}</span>
            </div>

            {/* Ads signal */}
            {p.adsInventorySignal && (
              <p className="mt-2 text-[11px] leading-snug text-white/40">
                <span
                  className={
                    p.adsInventorySignal.urgency === "high"
                      ? "text-red-400"
                      : p.adsInventorySignal.urgency === "medium"
                      ? "text-amber-400"
                      : "text-[#64DFDF]/70"
                  }
                >
                  ↳
                </span>{" "}
                {p.adsInventorySignal.message}
              </p>
            )}
          </div>

          <div className="mt-0.5 shrink-0 text-white/25">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          {/* Stock bar full */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                Nivel de stock
              </span>
              <StockEditor
                productName={p.productName}
                currentStock={p.currentStock}
                onSave={onStockUpdate}
              />
            </div>
            <StockLevelBar
              currentStock={p.currentStock}
              reorderPoint={p.reorderPoint}
              risk={p.risk}
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-white/25">
              <span>0</span>
              <span>Reorden: {p.reorderPoint}</span>
              <span>{Math.max(p.currentStock, p.reorderPoint * 2)}</span>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <MetricRow label="Velocidad promedio" value={velocityLabel} />
            <MetricRow label="Velocidad reciente" value={`${p.weightedDailySales.toFixed(1)} uds/día`} />
            <MetricRow label="Vendidos (30d)" value={`${p.unitsSold30d} uds`} />
            <MetricRow label="Vendidos (7d)" value={`${p.unitsSold7d} uds`} />
            <MetricRow label="Revenue (30d)" value={`$${p.revenue30d.toFixed(0)}`} />
            <MetricRow
              label="Ganancia neta (30d)"
              value={`$${p.netProfit30d.toFixed(0)}`}
              highlight={p.netProfit30d > 0}
            />
            <MetricRow
              label="Margen"
              value={`${p.marginPercent.toFixed(1)}%`}
              highlight={p.marginPercent > 20}
            />
            {p.adSpend30d > 0 && (
              <MetricRow label="Gasto en ads (30d)" value={`$${p.adSpend30d.toFixed(0)}`} />
            )}
            {p.productRoas > 0 && (
              <MetricRow
                label="ROAS del producto"
                value={`${p.productRoas.toFixed(1)}x`}
                highlight={p.productRoas >= 2}
              />
            )}
            <MetricRow label="Sell-through rate" value={`${p.sellThroughRate.toFixed(0)}%`} />
            {p.hasStockData && (
              <MetricRow label="Valor de inventario" value={`$${p.inventoryValue.toFixed(0)}`} />
            )}
          </div>

          {/* Reorder intelligence */}
          {p.hasStockData && (
            <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                Inteligencia de reposición
              </p>
              <div className="space-y-1">
                {p.shouldReorder && (
                  <p className="text-xs font-medium text-amber-300">
                    → Reponé ahora: pedí {p.reorderQuantity} unidades a tu proveedor.
                  </p>
                )}
                {!p.shouldReorder && p.daysUntilReorderPoint !== null && (
                  <p className="text-xs text-white/45">
                    → Reorden recomendado en ~{p.daysUntilReorderPoint} días (punto: {p.reorderPoint} uds).
                  </p>
                )}
                <p className="text-xs text-white/35">
                  Lead time proveedor: {p.supplierLeadDays} días ·
                  Cantidad sugerida: {p.reorderQuantity} uds
                </p>
              </div>
            </div>
          )}

          {/* No stock data prompt */}
          {!p.hasStockData && (
            <div className="mt-3 rounded-lg border border-white/8 bg-white/[0.02] p-3">
              <p className="text-[11px] text-white/35">
                Ingresá el stock actual para ver el forecast de quiebre y las alertas de reposición.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
