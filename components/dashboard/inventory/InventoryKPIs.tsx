"use client";

import { AlertTriangle, Archive, DollarSign, Package } from "lucide-react";
import type { InventoryKPIs as KPIs } from "@/lib/inventory/types";

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

type KPICardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
};

function KPICard({ icon, label, value, sub, color = "text-white" }: KPICardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-[#111111] p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40">
          {icon}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">{label}</p>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-white/35">{sub}</p>}
    </div>
  );
}

export function InventoryKPIs({ kpis }: { kpis: KPIs }) {
  const atRisk = kpis.criticalCount + kpis.warningCount;
  const atRiskColor =
    kpis.criticalCount > 0 ? "text-red-400" : kpis.warningCount > 0 ? "text-amber-400" : "text-white";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KPICard
        icon={<Package className="h-4 w-4" />}
        label="SKUs en stock"
        value={`${kpis.skusWithStockData}`}
        sub={`de ${kpis.totalSkus} productos detectados`}
      />
      <KPICard
        icon={<AlertTriangle className="h-4 w-4" />}
        label="En riesgo de quiebre"
        value={`${atRisk}`}
        sub={
          kpis.criticalCount > 0
            ? `${kpis.criticalCount} crítico${kpis.criticalCount > 1 ? "s" : ""}`
            : kpis.warningCount > 0
            ? `${kpis.warningCount} advertencia${kpis.warningCount > 1 ? "s" : ""}`
            : "Todos saludables"
        }
        color={atRiskColor}
      />
      <KPICard
        icon={<Archive className="h-4 w-4" />}
        label="Stock muerto"
        value={`${kpis.deadStockCount}`}
        sub={
          kpis.totalWastedInventoryValue > 0
            ? `${formatCurrency(kpis.totalWastedInventoryValue)} inmovilizado`
            : "Sin inmovilizado"
        }
        color={kpis.deadStockCount > 0 ? "text-white/60" : "text-white"}
      />
      <KPICard
        icon={<DollarSign className="h-4 w-4" />}
        label="Valor de inventario"
        value={formatCurrency(kpis.totalInventoryValue)}
        sub="costo total en stock"
      />
    </div>
  );
}
