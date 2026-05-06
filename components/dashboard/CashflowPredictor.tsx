import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export function CashflowPredictor({
  thisWeek,
  nextWeek,
  month,
}: {
  thisWeek: number;
  nextWeek: number;
  month: number;
}) {
  return (
    <Card glass className="border-margify-border bg-margify-cardAlt">
      <CardTitle>Proyección rápida</CardTitle>
      <CardDescription>
        Estimación de cobros según medios de pago y plazos típicos en LATAM.
      </CardDescription>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-margify-muted">Esta semana</dt>
          <dd className="font-semibold text-margify-cyan">{formatCurrency(thisWeek)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-margify-muted">Próxima semana</dt>
          <dd className="font-semibold text-white">{formatCurrency(nextWeek)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-margify-border pt-3">
          <dt className="text-margify-muted">Este mes (proyectado)</dt>
          <dd className="font-semibold text-white">{formatCurrency(month)}</dd>
        </div>
      </dl>
    </Card>
  );
}
