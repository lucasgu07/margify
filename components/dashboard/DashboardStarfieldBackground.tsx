"use client";

import { MargifyStarfieldBackdrop } from "@/components/ui/MargifyStarfieldBackdrop";

/**
 * Campo de partículas tipo cielo estrellado (blanco / gris suave) para el área del dashboard.
 * Queda fijo detrás del contenido; las tarjetas y el sidebar siguen opacos.
 */
export function DashboardStarfieldBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full" aria-hidden>
      <div className="absolute inset-0 bg-black" />
      <MargifyStarfieldBackdrop preset="full" />
    </div>
  );
}
