"use client";

import type { SimpleIcon } from "simple-icons";
import { siGoogleads, siMercadopago, siMeta, siShopify, siTiktok } from "simple-icons";
import type { IntegrationBrandId } from "@/lib/integration-brands";
import { cn } from "@/lib/utils";

export type { IntegrationBrandId } from "@/lib/integration-brands";
export {
  INTEGRATION_BRAND_ORDER,
  INTEGRATION_DISPLAY_LABEL,
  orderChannelToBrandId,
  storePlatformToBrandId,
} from "@/lib/integration-brands";

type BrandDef = { simple?: SimpleIcon; assetSrc?: string };

const BRANDS: Record<IntegrationBrandId, BrandDef> = {
  tiendanube: { assetSrc: "/integrations/tiendanube.svg" },
  shopify: { simple: siShopify },
  mercadolibre: { assetSrc: "/integrations/mercadolibre.svg" },
  mercadopago: { simple: siMercadopago },
  meta: { simple: siMeta },
  googleAds: { simple: siGoogleads },
  tiktok: { simple: siTiktok },
};

function SimpleIconGlyph({ icon, className }: { icon: SimpleIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={icon.path} />
    </svg>
  );
}

export function IntegrationBrandIcon({
  brand,
  size = "sm",
  className,
  withBackdrop = true,
}: {
  brand: IntegrationBrandId;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Fondo suave para contraste sobre cards oscuras. */
  withBackdrop?: boolean;
}) {
  const def = BRANDS[brand];
  const iconBox =
    size === "xs"
      ? "h-3.5 w-3.5"
      : size === "md"
        ? "h-[1.125rem] w-[1.125rem]"
        : size === "lg"
          ? "h-7 w-7"
          : "h-4 w-4";
  const imgClass =
    size === "xs"
      ? "h-3 w-auto max-w-[2.75rem]"
      : size === "md"
        ? "h-[1.1rem] w-auto max-w-[4rem]"
        : size === "lg"
          ? "h-8 w-auto max-w-[5.75rem]"
          : "h-3.5 w-auto max-w-[3.5rem]";

  const inner =
    def.simple != null ? (
      <SimpleIconGlyph icon={def.simple} className={cn(iconBox, "text-white/95")} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element -- SVG locales de marca
      <img
        src={def.assetSrc}
        alt=""
        className={cn(imgClass, "object-contain object-center brightness-0 invert")}
      />
    );

  if (!withBackdrop) {
    return <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>{inner}</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-control bg-white/[0.07] ring-1 ring-white/10",
        size === "xs"
          ? "h-6 min-w-[1.5rem] px-0.5"
          : size === "md"
            ? "h-8 min-w-[2rem] px-1"
            : size === "lg"
              ? "h-12 min-w-[3rem] px-2"
              : "h-7 min-w-[1.75rem] px-0.5",
        className
      )}
    >
      {inner}
    </span>
  );
}

/** Varias marcas en línea (p. ej. publicidad multi-plataforma). */
export function IntegrationBrandStack({
  brands,
  size = "xs",
  className,
}: {
  brands: IntegrationBrandId[];
  size?: "xs" | "sm";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      {brands.map((b) => (
        <IntegrationBrandIcon key={b} brand={b} size={size} />
      ))}
    </span>
  );
}
