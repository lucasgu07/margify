"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { DashboardHomeBody } from "@/components/dashboard/DashboardHomeBody";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DemoModeProvider } from "@/components/dashboard/DemoModeContext";
import { Header } from "@/components/ui/Header";
import { LandingHeroPreviewSidebar } from "@/components/landing/LandingHeroPreviewSidebar";
import { LandingPreviewStarfield } from "@/components/landing/LandingPreviewStarfield";
import { DEMO_USER_LABEL } from "@/lib/demo-user";
import { mockAlertsHistory } from "@/lib/mock-data";

/** Preview del hero: escala “contain” (toda la UI visible, sin recortes), centrada en el marco. */
export function LandingHeroDashboardPreview() {
  const alertCount = mockAlertsHistory.filter((a) => !a.read).length;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 });

  useLayoutEffect(() => {
    const outer = containerRef.current;
    const inner = contentRef.current;
    if (!outer || !inner) return;

    const run = () => {
      const bw = outer.clientWidth;
      const bh = outer.clientHeight;
      const iw = inner.offsetWidth;
      const ih = inner.offsetHeight;
      if (iw < 1 || ih < 1 || bw < 1 || bh < 1) return;
      const s = Math.min(bw / iw, bh / ih);
      if (!Number.isFinite(s) || s <= 0) return;
      const tx = (bw - iw * s) / 2;
      const ty = (bh - ih * s) / 2;
      setTransform({ scale: s, tx, ty });
    };

    run();
    const ro = new ResizeObserver(run);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-margify-border/70 bg-black shadow-[0_28px_100px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] ring-1 ring-white/[0.05] aspect-[1024/720]"
      role="region"
      aria-label="Vista previa interactiva del dashboard Margify"
    >
      <LandingPreviewStarfield />
      <DemoModeProvider
        value={{
          isDemo: true,
          full_name: DEMO_USER_LABEL.full_name,
          email: DEMO_USER_LABEL.email,
        }}
      >
        <DashboardProvider>
          <div
            ref={contentRef}
            className="absolute left-0 top-0 z-[1] w-[1024px] origin-top-left bg-transparent will-change-transform"
            style={{
              transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
            }}
          >
            <div className="flex min-h-0 w-full">
              <LandingHeroPreviewSidebar alertCount={alertCount} activeHref="/dashboard" />
              <div className="min-h-0 w-[784px] shrink-0 bg-transparent px-6 pb-4 pt-5">
                <Header
                  landingPreview
                  landingPreviewMode="dashboard"
                  density="compact"
                  userName={DEMO_USER_LABEL.full_name}
                  showConnect
                  onConnect={() => {
                    window.location.href = "/auth/register";
                  }}
                />
                <DashboardHomeBody variant="landingHero" />
              </div>
            </div>
          </div>
        </DashboardProvider>
      </DemoModeProvider>
    </div>
  );
}
