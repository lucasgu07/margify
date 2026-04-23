"use client";

import { Sparkles } from "@/components/ui/sparkles";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { INTEGRATION_BRAND_ORDER, INTEGRATION_DISPLAY_LABEL } from "@/lib/integration-brands";

const brands = INTEGRATION_BRAND_ORDER;

export function LandingIntegrationsShowcase() {
  return (
    <div className="relative mt-2 border-t border-margify-border/40 pt-12 md:mt-0 md:pt-14">
      <div
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(50%_50%_at_50%_0%,hsl(0_0%_100%),transparent_80%)]"
        aria-hidden
      >
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,hsl(170_100%_65%/0.15),transparent_65%)]" />
        <Sparkles
          density={900}
          className="absolute inset-0 h-full w-full [mask-image:radial-gradient(50%_50%_at_50%_20%,hsl(0_0%_100%),transparent_80%)]"
          color="rgba(100, 223, 223, 0.9)"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Plataformas con las que trabajamos
          </h2>
          <p className="mt-2 text-pretty text-sm text-margify-muted sm:text-base">
            Conectá las mismas tiendas y canales de ads que ya usás: todo queda orquestado en un solo
            tablero.
          </p>
        </div>

        <div className="relative mx-auto mt-8 h-24 w-full max-w-5xl sm:h-28 sm:mt-10">
          <InfiniteSlider
            className="flex h-full w-full items-center"
            duration={32}
            gap={40}
            durationOnHover={50}
          >
            {brands.map((id) => (
              <div
                key={id}
                className="flex w-[9.5rem] shrink-0 flex-col items-center justify-center gap-2 sm:w-44"
              >
                <IntegrationBrandIcon brand={id} size="md" withBackdrop />
                <span className="text-center text-xs font-medium text-margify-muted/95 sm:text-sm">
                  {INTEGRATION_DISPLAY_LABEL[id]}
                </span>
              </div>
            ))}
          </InfiniteSlider>
          <ProgressiveBlur
            className="pointer-events-none absolute top-0 left-0 h-full w-[100px] sm:w-[150px] md:w-[200px]"
            direction="left"
            blurIntensity={1}
          />
          <ProgressiveBlur
            className="pointer-events-none absolute top-0 right-0 h-full w-[100px] sm:w-[150px] md:w-[200px]"
            direction="right"
            blurIntensity={1}
          />
        </div>
      </div>
    </div>
  );
}
