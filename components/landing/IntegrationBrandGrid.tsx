import {
  INTEGRATION_BRAND_ORDER,
  INTEGRATION_DISPLAY_LABEL,
  type IntegrationBrandId,
} from "@/lib/integration-brands";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";

export function IntegrationBrandGrid() {
  return (
    <ul
      className="mt-10 grid max-w-md grid-cols-2 gap-2 sm:max-w-lg sm:grid-cols-3 sm:gap-2.5"
      aria-label="Plataformas que podés conectar"
    >
      {INTEGRATION_BRAND_ORDER.map((id: IntegrationBrandId) => (
        <li key={id} className="list-none">
          <div className="flex h-[3.5rem] items-center gap-2 rounded-control border border-margify-border/90 bg-margify-card/60 px-2 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition-colors duration-margify sm:h-[3.65rem] sm:px-2.5">
            <IntegrationBrandIcon brand={id} size="sm" />
            <span className="min-w-0 text-left text-[11px] font-semibold leading-tight tracking-tight text-white/90 sm:text-xs">
              {INTEGRATION_DISPLAY_LABEL[id]}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
