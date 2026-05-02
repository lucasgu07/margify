"use client";

import { Sparkles } from "@/components/ui/sparkles";

/** Misma estética que DashboardStarfieldBackground, contenida al marco del preview (no fixed). */
export function LandingPreviewStarfield() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
      aria-hidden
    >
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
