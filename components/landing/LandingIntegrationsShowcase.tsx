"use client";

import { Sparkles } from "@/components/ui/sparkles";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { INTEGRATION_BRAND_ORDER, INTEGRATION_DISPLAY_LABEL } from "@/lib/integration-brands";

const brands = INTEGRATION_BRAND_ORDER;

export function LandingIntegrationsShowcase() {
  /** Franja fina en esquinas: el área visible del carrusel queda casi entera. */
  const edgeBlend = "w-8 sm:w-9 md:w-10";

  return (
    <div className="relative pt-2 pb-16 md:pt-3 md:pb-20 lg:pb-24">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 [mask-image:linear-gradient(90deg,transparent_0%,white_4%,white_96%,transparent_100%)]"
        aria-hidden
      >
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,hsl(170_100%_65%/0.12),transparent_60%)]" />
        <Sparkles
          density={900}
          className="absolute inset-0 h-full w-full [mask-image:linear-gradient(90deg,transparent_0%,white_3%,white_97%,transparent_100%)]"
          color="rgba(100, 223, 223, 0.9)"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-[1.65rem]">
            Las apps con las que trabajamos
          </h2>
          <p className="mt-3 text-pretty text-sm text-margify-muted sm:text-base md:mt-4">
            Conectá las mismas tiendas y canales de ads que ya usás: todo queda orquestado en un solo
            tablero.
          </p>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-5xl sm:mt-12 md:mt-14">
          <div className="relative h-32 w-full sm:h-40 md:h-44">
            <InfiniteSlider
              className="flex h-full w-full items-center"
              duration={32}
              gap={40}
              durationOnHover={50}
            >
              {brands.map((id) => (
                <div
                  key={id}
                  className="flex w-[9.5rem] shrink-0 flex-col items-center justify-center gap-2.5 sm:w-44"
                >
                  <IntegrationBrandIcon brand={id} size="md" withBackdrop />
                  <span className="text-center text-xs font-medium text-margify-muted/95 sm:text-sm">
                    {INTEGRATION_DISPLAY_LABEL[id]}
                  </span>
                </div>
              ))}
            </InfiniteSlider>
            <ProgressiveBlur
              className={`pointer-events-none absolute top-0 left-0 h-full ${edgeBlend}`}
              direction="left"
              blurLayers={4}
              blurIntensity={0.6}
            />
            <ProgressiveBlur
              className={`pointer-events-none absolute top-0 right-0 h-full ${edgeBlend}`}
              direction="right"
              blurLayers={4}
              blurIntensity={0.6}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
