"use client";

import { useMemo, useState } from "react";
import { Area, ComposedChart, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  ChartContainer,
  chartGrid,
  MargifyXAxis,
  MargifyYAxis,
} from "@/components/ui/Chart";
import type { DateRangeKey } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { multiTouchClusterClasses } from "@/lib/multi-touch-cluster";
import { dashboardChartTooltipClass } from "@/lib/landing-glass-styles";

export type ComparativaDiariaRow = {
  date: string;
  labelTooltip: string;
  ventas: number;
  costos: number;
  ganancia: number;
};

function ComparativaDiariaTooltip(props: TooltipProps<ValueType, NameType>) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as ComparativaDiariaRow;
  return (
    <div className={cn(dashboardChartTooltipClass, "border-margify-border/60")}>
      <p className="mb-1.5 font-medium text-margify-text">{row.labelTooltip}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-margify-muted">
          <span className="text-margify-text">{p.name != null ? String(p.name) : "—"}:</span>{" "}
          {typeof p.value === "number" ? formatCurrency(p.value) : String(p.value)}
        </p>
      ))}
    </div>
  );
}

export function ComparativaDiariaChart({
  data,
  dateRange,
}: {
  data: ComparativaDiariaRow[];
  dateRange: DateRangeKey;
}) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const xInterval = useMemo(() => {
    if (dateRange === "today") return 3;
    const n = data.length;
    if (n <= 10) return 0;
    if (n <= 35) return 2;
    return Math.max(1, Math.floor(n / 10));
  }, [dateRange, data.length]);

  const minTickGap = dateRange === "today" ? 4 : 8;

  return (
    <div>
      <p className="mb-3 text-sm text-margify-muted">
        Tocá la leyenda para mostrar u ocultar cada serie.
      </p>
      <ChartContainer className="h-72 md:h-80">
        <ComposedChart
          key={`${dateRange}-${data.length}`}
          data={data}
          margin={{ left: 0, right: 8, top: 8, bottom: 4 }}
        >
          {chartGrid}
          <MargifyXAxis
            dataKey="date"
            tickMargin={8}
            interval={xInterval}
            minTickGap={minTickGap}
          />
          <MargifyYAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={44} />
          <Tooltip
            content={<ComparativaDiariaTooltip />}
            cursor={{ stroke: "#64DFDF", strokeWidth: 1, strokeOpacity: 0.45 }}
          />
          {!hidden.ventas ? (
            <Area
              type="monotone"
              dataKey="ventas"
              name="Ventas brutas"
              stroke="#ffffff"
              fill="#ffffff22"
              strokeWidth={2}
              animationDuration={500}
              animationEasing="ease-out"
            />
          ) : null}
          {!hidden.costos ? (
            <Area
              type="monotone"
              dataKey="costos"
              name="Costos totales"
              stroke="#888888"
              fill="#88888822"
              strokeWidth={2}
              animationDuration={500}
              animationEasing="ease-out"
            />
          ) : null}
          {!hidden.ganancia ? (
            <Area
              type="monotone"
              dataKey="ganancia"
              name="Ganancia neta"
              stroke="#64DFDF"
              fill="#64DFDF22"
              strokeWidth={2}
              animationDuration={500}
              animationEasing="ease-out"
            />
          ) : null}
        </ComposedChart>
      </ChartContainer>

      <div className={cn("mt-4 flex flex-wrap gap-2", multiTouchClusterClasses)}>
        {[
          { id: "ventas", label: "Ventas brutas", color: "bg-white" },
          { id: "costos", label: "Costos totales", color: "bg-[#888888]" },
          { id: "ganancia", label: "Ganancia neta", color: "bg-margify-cyan" },
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
