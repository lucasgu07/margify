"use client";

import type { StockRisk } from "@/lib/inventory/types";

type StockLevelBarProps = {
  currentStock: number;
  reorderPoint: number;
  maxDisplay?: number;
  risk: StockRisk;
  compact?: boolean;
};

function riskColor(risk: StockRisk): string {
  switch (risk) {
    case "critical": return "bg-red-500";
    case "warning": return "bg-amber-400";
    case "healthy": return "bg-[#64DFDF]";
    case "overstock": return "bg-blue-400";
    case "dead": return "bg-white/20";
    default: return "bg-white/15";
  }
}

export function StockLevelBar({
  currentStock,
  reorderPoint,
  maxDisplay,
  risk,
  compact = false,
}: StockLevelBarProps) {
  const max = maxDisplay ?? Math.max(currentStock * 1.5, reorderPoint * 2, 10);
  const stockPct = Math.min(100, (currentStock / max) * 100);
  const reorderPct = Math.min(100, (reorderPoint / max) * 100);

  return (
    <div className={`relative ${compact ? "h-1.5" : "h-2"} w-full overflow-hidden rounded-full bg-white/8`}>
      {/* Stock fill */}
      <div
        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${riskColor(risk)}`}
        style={{ width: `${stockPct}%` }}
      />
      {/* Reorder point marker */}
      {!compact && (
        <div
          className="absolute top-0 h-full w-px bg-white/25"
          style={{ left: `${reorderPct}%` }}
          title={`Punto de reorden: ${reorderPoint}`}
        />
      )}
    </div>
  );
}
