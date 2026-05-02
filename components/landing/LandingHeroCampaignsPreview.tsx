"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { CampanasPageClient } from "@/components/dashboard/CampanasPageClient";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DemoModeProvider } from "@/components/dashboard/DemoModeContext";
import { Header } from "@/components/ui/Header";
import { LandingHeroPreviewSidebar } from "@/components/landing/LandingHeroPreviewSidebar";
import { LandingPreviewStarfield } from "@/components/landing/LandingPreviewStarfield";
import { DEMO_USER_LABEL } from "@/lib/demo-user";
import { mockAlertsHistory } from "@/lib/mock-data";

/** Vista previa interactiva de Campañas (misma lógica que /dashboard/campanas). */
export function LandingHeroCampaignsPreview() {
  const alertCount = mockAlertsHistory.filter((a) => !a.read).length;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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
      const s = Math.max(bw / iw, bh / ih);
      setScale(Number.isFinite(s) && s > 0 ? s : 1);
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
      className="relative mx-auto w-full max-w-[min(100%,42rem)] overflow-hidden rounded-2xl border border-margify-border/70 bg-black shadow-[0_28px_100px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] ring-1 ring-white/[0.05] aspect-[1024/680]"
      role="region"
      aria-label="Vista previa interactiva de campañas Margify"
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
            className="absolute left-0 top-0 z-[1] w-[1024px] origin-top-left bg-transparent"
            style={{
              transform: `scale(${scale})`,
            }}
          >
            <div className="flex min-h-0 w-full">
              <LandingHeroPreviewSidebar
                alertCount={alertCount}
                activeHref="/dashboard/campanas"
              />
              <div className="min-h-0 w-[784px] shrink-0 bg-transparent px-6 pb-4 pt-5">
                <Header
                  landingPreview
                  landingPreviewMode="campanas"
                  density="compact"
                  userName={DEMO_USER_LABEL.full_name}
                />
                <CampanasPageClient hideHeader />
              </div>
            </div>
          </div>
        </DashboardProvider>
      </DemoModeProvider>
    </div>
  );
}
