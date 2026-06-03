"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Layers, Search } from "lucide-react";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { Header } from "@/components/ui/Header";
import { InventoryKPIs } from "@/components/dashboard/inventory/InventoryKPIs";
import { InventoryAlerts } from "@/components/dashboard/inventory/InventoryAlerts";
import { ProductInventoryCard } from "@/components/dashboard/inventory/ProductInventoryCard";
import type { InventoryPayload, ProductInventoryIntel, StockRisk } from "@/lib/inventory/types";

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type RiskFilter = "all" | StockRisk;

const FILTER_TABS: { key: RiskFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "critical", label: "Crítico" },
  { key: "warning", label: "Advertencia" },
  { key: "healthy", label: "Saludable" },
  { key: "overstock", label: "Sobrestock" },
  { key: "dead", label: "Muerto" },
  { key: "unknown", label: "Sin datos" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function InventorySkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl bg-[#111111]"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
        <Layers className="h-7 w-7 text-white/25" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/50">Sin datos de inventario</p>
        <p className="mt-1 text-xs text-white/30">
          Conectá tu tienda o ingresá stock manualmente en cada producto.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InventarioPage() {
  const { full_name } = useDashboardIdentity();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InventoryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [search, setSearch] = useState("");

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchInventory = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory", { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar inventario");
      const json = (await res.json()) as InventoryPayload;
      setData(json);
    } catch (e) {
      setError("No pudimos cargar el inventario. Revisá tu conexión e intentá de nuevo.");
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchInventory(false);
  }, [fetchInventory]);

  // ─── Stock update handler ──────────────────────────────────────────────────

  const handleStockUpdate = useCallback(async (productName: string, qty: number) => {
    try {
      await fetch("/api/inventory/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: productName, current_stock: qty }),
      });
      // Refresh data after update
      await fetchInventory(true);
    } catch (e) {
      console.error("Stock update failed:", e);
    }
  }, [fetchInventory]);

  // ─── Filtered products ─────────────────────────────────────────────────────

  const filteredProducts = useMemo((): ProductInventoryIntel[] => {
    if (!data) return [];
    let products = data.products;
    if (riskFilter !== "all") {
      products = products.filter((p) => p.risk === riskFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter((p) => p.productName.toLowerCase().includes(q));
    }
    return products;
  }, [data, riskFilter, search]);

  // ─── Filter tab counts ─────────────────────────────────────────────────────

  const countByRisk = useMemo(() => {
    if (!data) return {} as Record<RiskFilter, number>;
    const counts: Record<string, number> = { all: data.products.length };
    for (const p of data.products) {
      counts[p.risk] = (counts[p.risk] ?? 0) + 1;
    }
    return counts as Record<RiskFilter, number>;
  }, [data]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <Header userName={full_name} showDateRange={false} />

      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#64DFDF]/10">
            <Layers className="h-5 w-5 text-[#64DFDF]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Inventario</h1>
            <p className="text-sm text-white/40">Inteligencia de stock · últimos 30 días</p>
          </div>
        </div>
        <button
          type="button"
          disabled={loading || refreshing}
          onClick={() => void fetchInventory(true)}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/50 transition hover:border-[#64DFDF]/30 hover:text-[#64DFDF] disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && <InventorySkeleton />}

      {/* ── Error ── */}
      {error && !loading && (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* ── Main content ── */}
      {data && !loading && (
        <>
          {/* KPIs */}
          <InventoryKPIs kpis={data.kpis} />

          {/* Alerts */}
          {(data.kpis.criticalCount > 0 || data.kpis.warningCount > 0 || data.kpis.deadStockCount > 0) && (
            <InventoryAlerts products={data.products} />
          )}

          {/* Search + filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#64DFDF]/30"
              />
            </div>

            {/* Risk filter tabs */}
            <div className="flex flex-wrap gap-1.5">
              {FILTER_TABS.map((tab) => {
                const count = countByRisk[tab.key] ?? 0;
                if (tab.key !== "all" && count === 0) return null;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRiskFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                      riskFilter === tab.key
                        ? "bg-[#64DFDF] text-black"
                        : "border border-white/10 text-white/45 hover:border-white/20 hover:text-white/65"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                        riskFilter === tab.key ? "bg-black/20 text-black" : "bg-white/10"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product list */}
          {filteredProducts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2.5">
              {filteredProducts.map((product) => (
                <ProductInventoryCard
                  key={product.productName}
                  product={product}
                  onStockUpdate={handleStockUpdate}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-white/20">
            {data.products.length} SKU{data.products.length !== 1 ? "s" : ""} detectados ·
            Actualizado {new Date(data.generatedAt).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
      )}
    </div>
  );
}
