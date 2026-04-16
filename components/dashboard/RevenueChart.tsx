"use client";

import { useMemo, useState } from "react";
import { Area, ComposedChart, Line, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  ChartContainer,
  chartGrid,
  MargifyXAxis,
  MargifyYAxis,
} from "@/components/ui/Chart";
import { DATE_RANGE_LABELS } from "@/lib/dashboard-filters";
import type { DateRangeKey, RevenueChartRow } from "@/types";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { cn, formatCurrency } from "@/lib/utils";

function RevenueChartTooltip(props: TooltipProps<ValueType, NameType>) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as RevenueChartRow;
  return (
    <div className="rounded-control border border-margify-border bg-margify-card px-3 py-2 text-xs shadow-lg">
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

export function RevenueChart({
  data,
  dateRange,
  rangeLabel,
}: {
  data: RevenueChartRow[];
  dateRange: DateRangeKey;
  /** Si viene del contexto, incluye fechas cuando el rango es personalizado. */
  rangeLabel?: string;
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
    <div className="rounded-card border border-margify-border bg-margify-card p-4 md:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">
          {rangeLabel ?? DATE_RANGE_LABELS[dateRange]}
        </h2>
        <p className="text-sm text-margify-muted">
          Tocá la leyenda para mostrar u ocultar cada serie.
        </p>
      </div>
      <ChartContainer>
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
            content={<RevenueChartTooltip />}
            cursor={{ stroke: "#64DFDF", strokeWidth: 1, strokeOpacity: 0.45 }}
          />
          {!hidden.ventas ? (
            <Line
              type="monotone"
              dataKey="ventas"
              name="Ventas"
              stroke="#ffffff"
              strokeWidth={2}
              dot={false}
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
              fill="#64DFDF"
              fillOpacity={0.1}
              strokeWidth={2}
              animationDuration={500}
              animationEasing="ease-out"
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
              animationDuration={500}
              animationEasing="ease-out"
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
            {item.id === "ads" ? <IntegrationBrandIcon brand="meta" size="xs" /> : null}
            <span className={hidden[item.id] ? "text-margify-muted line-through" : ""}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
