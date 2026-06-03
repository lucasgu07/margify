"use client";

import { AlertTriangle, Pause, TrendingUp, RefreshCw, Archive } from "lucide-react";
import type { ProductInventoryIntel } from "@/lib/inventory/types";

type AlertItem = {
  productName: string;
  message: string;
  level: "critical" | "warning" | "info";
  icon: React.ReactNode;
};

function buildAlerts(products: ProductInventoryIntel[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const p of products) {
    // Critical stockout
    if (p.risk === "critical" && p.currentStock > 0) {
      alerts.push({
        productName: p.productName,
        message: `Quiebre en ~${p.daysUntilStockout} día${p.daysUntilStockout === 1 ? "" : "s"}. Reponé ${p.reorderQuantity} unidades.`,
        level: "critical",
        icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
      });
    }

    // Warning stockout
    if (p.risk === "warning") {
      alerts.push({
        productName: p.productName,
        message: `~${p.daysUntilStockout} días de stock. ${p.shouldReorder ? "Ya llegaste al punto de reorden." : `Reorden recomendado en ${p.daysUntilReorderPoint ?? "pocos"} días.`}`,
        level: "warning",
        icon: <RefreshCw className="h-3.5 w-3.5 shrink-0" />,
      });
    }

    // Ads + low stock
    if (
      p.adsInventorySignal?.type === "pause_ads_low_stock" ||
      p.adsInventorySignal?.type === "restock_urgently"
    ) {
      alerts.push({
        productName: p.productName,
        message: p.adsInventorySignal.message,
        level: p.adsInventorySignal.urgency === "high" ? "critical" : "warning",
        icon: <Pause className="h-3.5 w-3.5 shrink-0" />,
      });
    }

    // Dead stock
    if (p.risk === "dead" && p.inventoryValue > 50) {
      alerts.push({
        productName: p.productName,
        message: `Sin ventas en 30+ días. ${
          p.inventoryValue > 0
            ? `Tenés $${p.inventoryValue.toFixed(0)} inmovilizado.`
            : "Considerá liquidar con descuento."
        }`,
        level: "info",
        icon: <Archive className="h-3.5 w-3.5 shrink-0" />,
      });
    }

    // Scale opportunity
    if (p.adsInventorySignal?.type === "scale_ads_good_margin") {
      alerts.push({
        productName: p.productName,
        message: p.adsInventorySignal.message,
        level: "info",
        icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />,
      });
    }

    if (alerts.length >= 6) break;
  }

  return alerts;
}

function alertStyles(level: AlertItem["level"]) {
  switch (level) {
    case "critical":
      return {
        container: "border-red-900/60 bg-red-950/30",
        icon: "text-red-400",
        name: "text-red-300",
      };
    case "warning":
      return {
        container: "border-amber-900/50 bg-amber-950/20",
        icon: "text-amber-400",
        name: "text-amber-300",
      };
    default:
      return {
        container: "border-white/8 bg-white/[0.02]",
        icon: "text-[#64DFDF]/70",
        name: "text-white/60",
      };
  }
}

export function InventoryAlerts({ products }: { products: ProductInventoryIntel[] }) {
  const alerts = buildAlerts(products);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
        Alertas inteligentes
      </p>
      {alerts.map((alert, i) => {
        const styles = alertStyles(alert.level);
        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${styles.container}`}
          >
            <span className={`mt-0.5 ${styles.icon}`}>{alert.icon}</span>
            <div className="min-w-0">
              <span className={`text-xs font-semibold ${styles.name}`}>
                {alert.productName}
                {" · "}
              </span>
              <span className="text-xs text-white/50">{alert.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
