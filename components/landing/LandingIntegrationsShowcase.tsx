"use client";

import { useEffect, useState } from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { INTEGRATION_BRAND_ORDER, INTEGRATION_DISPLAY_LABEL } from "@/lib/integration-brands";

const brands = INTEGRATION_BRAND_ORDER;

const MOBILE_MAX = 639;

export function LandingIntegrationsShowcase() {
  const [sliderGap, setSliderGap] = useState(44);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const update = () => setSliderGap(mq.matches ? 20 : 44);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /** Franja en esquinas: en móvil un poco más fina para que se vea más tira útil. */
  const edgeBlend = "w-6 sm:w-9 md:w-10";

  return (
    <div className="relative pt-2 pb-16 md:pt-3 md:pb-20 lg:pb-24">
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-3 md:px-5 lg:max-w-[100rem] lg:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-[1.65rem]">
            Las apps con las que trabajamos
          </h2>
          <p className="mt-3 text-pretty text-sm text-margify-muted sm:text-base md:mt-4">
            Conectá las mismas tiendas y canales de ads que ya usás: todo queda orquestado en un solo
            tablero.
          </p>
        </div>

        <div className="relative mx-auto mt-10 w-full sm:mt-12 md:mt-14">
          <div className="relative h-44 w-full sm:h-52 md:h-56">
            <InfiniteSlider
              className="flex h-full w-full items-center"
              duration={32}
              gap={sliderGap}
              durationOnHover={50}
            >
              {brands.map((id) => (
                <div
                  key={id}
                  className="flex w-[9.5rem] shrink-0 flex-col items-center justify-center gap-2.5 sm:w-52 sm:gap-3"
                >
                  <IntegrationBrandIcon brand={id} size="lg" withBackdrop />
                  <span className="text-center text-sm font-medium text-margify-muted/95 sm:text-base">
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
