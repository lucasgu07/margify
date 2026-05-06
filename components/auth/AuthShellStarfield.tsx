"use client";

import { MargifyStarfieldBackdrop } from "@/components/ui/MargifyStarfieldBackdrop";

/** Mismo preset que el fondo del dashboard (partículas blancas). */
export function AuthShellStarfield() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      <MargifyStarfieldBackdrop preset="full" />
    </div>
  );
}
