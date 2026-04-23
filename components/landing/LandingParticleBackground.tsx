"use client";

import { Sparkles } from "@/components/ui/sparkles";

/**
 * Sustituye la grilla de puntos estáticos: mismo campo de partículas en toda la landing,
 * debajo de los degrades cian (LandingMainAmbient) y el contenido.
 */
export function LandingParticleBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full" aria-hidden>
      <div className="absolute inset-0 opacity-[0.32]">
        <Sparkles
          density={720}
          className="absolute inset-0 h-full w-full"
          color="rgba(100, 223, 223, 0.95)"
          size={1}
          speed={0.6}
        />
      </div>
    </div>
  );
}
