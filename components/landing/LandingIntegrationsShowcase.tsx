"use client";

import { useEffect, useState } from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
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

  return (
    <div className="relative pt-2 pb-16 md:pt-3 md:pb-20 lg:pb-24">
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-3 md:px-5 lg:max-w-[100rem] lg:px-6">
        <div className="mx-auto max-w-2xl pt-12 text-center sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-[1.65rem]">
            Las apps con las que trabajamos
          </h2>
          <p className="mt-3 text-pretty text-sm text-neutral-400 sm:text-base md:mt-4">
            Conectá las mismas tiendas y canales de ads que ya usás: todo queda orquestado en un solo
            tablero.
          </p>
        </div>

        <div className="relative mx-auto mt-5 w-full sm:mt-6 md:mt-8">
          <div
            className="relative h-44 w-full overflow-hidden py-1 sm:h-52 md:h-56"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
            }}
          >
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
                  <IntegrationBrandIcon
                    brand={id}
                    size="lg"
                    withBackdrop
                    className="border border-white/12 !bg-white/[0.09] ring-white/10 backdrop-blur-md"
                  />
                  <span className="text-center text-sm font-medium text-neutral-300 sm:text-base">
                    {INTEGRATION_DISPLAY_LABEL[id]}
                  </span>
                </div>
              ))}
            </InfiniteSlider>
          </div>
        </div>
      </div>
    </div>
  );
}
