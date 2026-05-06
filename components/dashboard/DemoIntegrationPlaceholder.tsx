"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import type { IntegrationBrandId } from "@/lib/integration-brands";

/**
 * Vista única cuando el usuario entró con "Ver demo" (sin cuenta): no se pueden conectar integraciones.
 */
export function DemoIntegrationPlaceholder({
  brand,
  name,
}: {
  brand: IntegrationBrandId;
  name: string;
}) {
  return (
    <Card glass className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-lg font-semibold text-white">
          <IntegrationBrandIcon brand={brand} size="sm" />
          {name}
        </p>
        <p className="mt-2 text-sm text-margify-muted">
          Estás en <span className="text-margify-text">modo demo</span>: no podés conectar cuentas ni sincronizar datos.{" "}
          <Link
            href="/auth/register"
            className="font-medium text-margify-cyan underline underline-offset-2 hover:text-margify-cyan/90"
          >
            Registrate
          </Link>{" "}
          o{" "}
          <Link
            href="/auth/login"
            className="font-medium text-margify-cyan underline underline-offset-2 hover:text-margify-cyan/90"
          >
            iniciá sesión
          </Link>{" "}
          para vincular tiendas y publicidad.
        </p>
      </div>
    </Card>
  );
}
