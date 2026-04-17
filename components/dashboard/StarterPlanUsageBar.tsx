import { STARTER_PLAN_MONTHLY_ORDER_LIMIT } from "@/lib/mock-data";

type Props = {
  ordersUsed: number;
  limit?: number;
};

export function StarterPlanUsageBar({ ordersUsed, limit = STARTER_PLAN_MONTHLY_ORDER_LIMIT }: Props) {
  const pct = Math.min((ordersUsed / limit) * 100, 100);
  const over = ordersUsed > limit;

  return (
    <div
      className="-mx-4 mb-4 border-b border-margify-border/60 bg-margify-black/35 md:-mx-8"
      role="status"
      aria-label={`Plan Gratis: ${ordersUsed} de ${limit} órdenes usadas este mes`}
    >
      <div className="px-4 py-2.5 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
          <p className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-margify-muted">
            Plan Gratis · órdenes este mes
          </p>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-margify-border/80"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-margify-cyan/70 to-margify-cyan transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={`shrink-0 tabular-nums text-xs font-semibold ${over ? "text-margify-negative" : "text-margify-muted"}`}
            >
              {ordersUsed}/{limit}
            </span>
          </div>
          {over ? (
            <div className="text-right sm:ml-auto">
              <p className="text-[11px] text-margify-negative">Superaste el cupo del plan Gratis.</p>
              <p className="mt-0.5 max-w-md text-[11px] leading-snug text-margify-muted sm:max-w-xs">
                El panel solo muestra métricas de las primeras {limit} ventas del mes; el resto no se incluye hasta
                que actualices el plan.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
