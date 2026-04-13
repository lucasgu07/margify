"use client";

import { useState } from "react";
import { Area, ComposedChart, Line } from "recharts";
import {
  ChartContainer,
  chartGrid,
  MargifyTooltip,
  MargifyXAxis,
  MargifyYAxis,
} from "@/components/ui/Chart";
import { cn } from "@/lib/utils";

type Row = { date: string; ventas: number; ganancia: number; ads: number };

export function RevenueChart({ data }: { data: Row[] }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  return (
    <div className="rounded-card border border-margify-border bg-margify-card p-4 md:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Últimos 30 días</h2>
        <p className="text-sm text-margify-muted">
          Tocá la leyenda para mostrar u ocultar cada serie.
        </p>
      </div>
      <ChartContainer>
        <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          {chartGrid}
          <MargifyXAxis dataKey="date" tickMargin={8} />
          <MargifyYAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={44} />
          <MargifyTooltip />
          {!hidden.ventas ? (
            <Line
              type="monotone"
              dataKey="ventas"
              name="Ventas"
              stroke="#ffffff"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ) : null}
          {!hidden.ganancia ? (
            <Area
              type="monotone"
              dataKey="ganancia"
              name="Ganancia neta"
              stroke="#64DFDF"
              fill="#64DFDF"
              fillOpacity={0.1}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ) : null}
          {!hidden.ads ? (
            <Line
              type="monotone"
              dataKey="ads"
              name="Gasto en ads"
              stroke="#888888"
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ) : null}
        </ComposedChart>
      </ChartContainer>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { id: "ventas", label: "Ventas", color: "bg-white" },
          { id: "ganancia", label: "Ganancia neta", color: "bg-margify-cyan" },
          { id: "ads", label: "Gasto en ads", color: "bg-margify-muted" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setHidden((h) => ({ ...h, [item.id]: !h[item.id] }))}
            className={cn(
              "flex items-center gap-2 rounded-full border border-margify-border px-3 py-1.5 text-xs font-medium transition-all duration-margify hover:border-margify-cyan/40",
              hidden[item.id] ? "opacity-35" : "text-margify-text"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", item.color)} />
            <span className={hidden[item.id] ? "text-margify-muted line-through" : ""}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
