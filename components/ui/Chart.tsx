"use client";

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const axisProps = {
  stroke: "#888888",
  tick: { fill: "#888888", fontSize: 11 },
  tickLine: false,
};

export const chartGrid = (
  <CartesianGrid stroke="#222222" strokeDasharray="3 6" vertical={false} />
);

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; dataKey?: string | number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-margify-border bg-margify-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-margify-text">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-margify-muted">
          <span className="text-margify-text">{p.name}:</span>{" "}
          {typeof p.value === "number" ? p.value.toLocaleString("es-AR") : p.value}
        </p>
      ))}
    </div>
  );
}

export function ChartContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("h-72 w-full md:h-80", className)}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

export function MargifyXAxis(props: React.ComponentProps<typeof XAxis>) {
  return <XAxis {...axisProps} {...props} />;
}

export function MargifyYAxis(props: React.ComponentProps<typeof YAxis>) {
  return <YAxis {...axisProps} {...props} />;
}

export function MargifyTooltip() {
  return <Tooltip content={(props) => <ChartTooltipContent {...props} />} />;
}

export { Legend };
