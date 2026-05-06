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
import { dashboardChartTooltipClass, landingGlassPanel, landingGlassPanelHover } from "@/lib/landing-glass-styles";
import { DATE_RANGE_LABELS } from "@/lib/dashboard-filters";
import type { DateRangeKey, RevenueChartRow } from "@/types";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { cn, formatCurrency } from "@/lib/utils";
import { multiTouchClusterClasses } from "@/lib/multi-touch-cluster";

function RevenueChartTooltip(props: TooltipProps<ValueType, NameType>) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as RevenueChartRow;
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

export function RevenueChart({
  data,
  dateRange,
  rangeLabel,
  compact = false,
}: {
  data: RevenueChartRow[];
  dateRange: DateRangeKey;
  /** Si viene del contexto, incluye fechas cuando el rango es personalizado. */
  rangeLabel?: string;
  /** Gráfico más bajo para embeds (p. ej. hero de la landing). */
  compact?: boolean;
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
    <div
      className={cn(
        "rounded-card border",
        landingGlassPanel,
        landingGlassPanelHover,
        "shadow-[0_10px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(100,223,223,0.06)]",
        compact ? "p-3" : "p-4 md:p-5"
      )}
    >
      <div className={cn(compact ? "mb-2" : "mb-4")}>
        <h2 className={cn("font-semibold text-white", compact ? "text-base leading-snug" : "text-lg")}>
          {rangeLabel ?? DATE_RANGE_LABELS[dateRange]}
        </h2>
        <p className={cn("text-margify-muted", compact ? "mt-0.5 text-[11px] leading-snug" : "text-sm")}>
          Tocá la leyenda para mostrar u ocultar cada serie.
        </p>
      </div>
      <ChartContainer className={compact ? "h-36 w-full md:h-36" : undefined}>
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

      <div className={cn("flex flex-wrap gap-2", multiTouchClusterClasses, compact ? "mt-2" : "mt-4")}>
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
              "flex items-center gap-1.5 rounded-full border border-margify-border font-medium outline-none transition-colors duration-200 ease-out motion-safe:hover:border-margify-cyan/50 focus-visible:ring-2 focus-visible:ring-margify-cyan/40 touch-manipulation",
              compact ? "px-2 py-1 text-[10px]" : "gap-2 px-3 py-1.5 text-xs",
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
