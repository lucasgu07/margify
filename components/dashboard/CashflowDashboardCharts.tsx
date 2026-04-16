"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ChartContainer } from "@/components/ui/Chart";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";

function pendingSliceBrand(name: string): "mercadolibre" | "mercadopago" | null {
  if (name === "Mercado Libre") return "mercadolibre";
  if (name === "Mercado Pago") return "mercadopago";
  return null;
}

const M = {
  cyan: "#64DFDF",
  muted: "#888888",
  border: "#222222",
} as const;

const PENDING_DONUT_COLORS: Record<string, string> = {
  "Mercado Libre": M.muted,
  "Mercado Pago": M.cyan,
};

function PieCashTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const v = p?.value;
  return (
    <div className="rounded-control border border-margify-border bg-margify-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-margify-text">{p?.name != null ? String(p.name) : "—"}</p>
      <p className="text-margify-muted">{typeof v === "number" ? formatCurrency(v) : v}</p>
    </div>
  );
}

export function CashflowPendingDonutSection({
  slices,
  totalPending,
}: {
  slices: { name: string; value: number }[];
  totalPending: number;
}) {
  const visible = slices.filter((s) => s.value > 0);
  const hasData = visible.length > 0 && totalPending > 0;

  return (
    <Card className="min-w-0 border-margify-border bg-margify-cardAlt">
      <CardTitle>Distribución de pagos pendientes</CardTitle>
      <CardDescription>
        Monto aún no liquidado agrupado por red de cobro (Mercado Libre vs. Mercado Pago u otros).
      </CardDescription>
      <div className="relative mt-4 flex min-h-[16rem] min-w-0 items-center justify-center">
        {hasData ? (
          <>
            <ChartContainer className="h-72 md:h-80">
              <PieChart>
                <Pie
                  data={visible}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  animationDuration={500}
                >
                  {visible.map((s) => (
                    <Cell
                      key={s.name}
                      fill={PENDING_DONUT_COLORS[s.name] ?? M.muted}
                      stroke={M.border}
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieCashTooltip />} />
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 pt-2 text-center">
              <p className="text-lg font-bold tabular-nums text-margify-text md:text-xl">
                {formatCurrencyCompact(totalPending)}
              </p>
              <p className="max-w-[10rem] text-xs leading-tight text-margify-muted">Pagos pendientes</p>
            </div>
          </>
        ) : (
          <div className="flex h-72 w-full items-center justify-center rounded-control border border-dashed border-margify-border text-sm text-margify-muted">
            No hay montos pendientes en el período.
          </div>
        )}
      </div>
      {hasData ? (
        <ul className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-margify-muted">
          {visible.map((s) => {
            const brand = pendingSliceBrand(s.name);
            return (
              <li key={s.name} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-margify-border"
                  style={{
                    backgroundColor: PENDING_DONUT_COLORS[s.name] ?? M.muted,
                  }}
                />
                {brand ? <IntegrationBrandIcon brand={brand} size="xs" /> : null}
                <span className="text-margify-text">{s.name}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}
