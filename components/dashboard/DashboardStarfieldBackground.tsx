"use client";

import { Sparkles } from "@/components/ui/sparkles";

/**
 * Campo de partículas tipo cielo estrellado (blanco / gris suave) para el área del dashboard.
 * Queda fijo detrás del contenido; las tarjetas y el sidebar siguen opacos.
 */
export function DashboardStarfieldBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full" aria-hidden>
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 opacity-[0.38]">
        <Sparkles
          density={680}
          className="absolute inset-0 h-full w-full"
          color="#ffffff"
          size={1.1}
          speed={0.45}
          opacity={0.55}
          opacitySpeed={2}
          minOpacity={0.12}
        />
      </div>
    </div>
  );
}
