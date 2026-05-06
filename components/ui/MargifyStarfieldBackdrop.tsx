"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "@/components/ui/sparkles";

const PRESET = {
  /** Misma lectura visual que `DashboardStarfieldBackground` (partículas blancas). */
  full: {
    wrap: "opacity-[0.42]",
    density: 680,
    size: 1.1,
    speed: 0.45,
    opacity: 0.55,
    minOpacity: 0.12,
  },
  /** Menos partículas para columna estrecha; sigue siendo reconocible. */
  sidebar: {
    wrap: "opacity-[0.3]",
    density: 180,
    size: 1,
    speed: 0.4,
    opacity: 0.5,
    minOpacity: 0.11,
  },
} as const;

export type MargifyStarfieldPreset = keyof typeof PRESET;

export function MargifyStarfieldBackdrop({
  preset,
  className,
}: {
  preset: MargifyStarfieldPreset;
  className?: string;
}) {
  const p = PRESET[preset];
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className={cn("absolute inset-0", p.wrap)}>
        <Sparkles
          density={p.density}
          className="absolute inset-0 h-full w-full"
          color="#ffffff"
          size={p.size}
          speed={p.speed}
          opacity={p.opacity}
          opacitySpeed={2}
          minOpacity={p.minOpacity}
        />
      </div>
    </div>
  );
}
