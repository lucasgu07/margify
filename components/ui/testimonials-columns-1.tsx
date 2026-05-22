"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { landingGlassPanel, landingGlassPanelHover } from "@/lib/landing-glass-styles";

export type TestimonialItem = {
  text: string;
  /** Si no hay URL, la tarjeta muestra solo nombre y rol (sin avatar). */
  image?: string;
  name: string;
  role: string;
};

/** Mismo tamaño en grilla, carrusel y columna móvil. */
export const testimonialCardDimensions =
  "box-border h-[13.25rem] w-[17.5rem] max-w-[calc(100vw-2rem)] shrink-0";

/** Filas fijas: el texto y el nombre arrancan a la misma altura en todos los cuadrantes. */
const testimonialCardGrid =
  "grid grid-rows-[8rem_2.875rem] gap-1.5 content-start";

function TestimonialCardFooter({ item }: { item: TestimonialItem }) {
  return (
    <div className={cn("flex shrink-0 items-center", item.image ? "gap-2.5" : "")}>
      {item.image ? (
        /* eslint-disable-next-line @next/next/no-img-element -- fotos de testimonio en landing */
        <img
          width={40}
          height={40}
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-10 w-10 shrink-0 rounded-full border border-white/15 object-cover"
        />
      ) : null}
      <div className="min-w-0 flex flex-col">
        <span className="text-sm font-semibold leading-tight tracking-tight text-white">{item.name}</span>
        <span className="text-xs leading-tight tracking-tight text-neutral-400">{item.role}</span>
      </div>
    </div>
  );
}

export function TestimonialCard({ item, className }: { item: TestimonialItem; className?: string }) {
  return (
    <article
      className={cn(
        "rounded-control border p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(100,223,223,0.06)]",
        testimonialCardDimensions,
        testimonialCardGrid,
        landingGlassPanel,
        landingGlassPanelHover,
        className
      )}
    >
      <p className="min-h-0 overflow-hidden text-sm leading-snug text-neutral-300 line-clamp-5">
        {item.text}
      </p>
      <div className="flex min-h-0 items-center">
        <TestimonialCardFooter item={item} />
      </div>
    </article>
  );
}

/** Una columna vertical con scroll infinito (contenido duplicado para loop continuo). */
export function TestimonialsColumn(props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) {
  const duration = props.duration ?? 18;

  return (
    <div
      className={cn(
        "min-h-0 w-full max-w-xs shrink-0 overflow-hidden contain-paint",
        "mx-auto flex-none",
        props.className
      )}
      data-lenis-prevent
    >
      <div
        className="flex w-full animate-marquee-y flex-col items-center gap-5 pb-5 motion-gpu"
        style={{ animationDuration: `${duration}s` }}
      >
        {[0, 1].map((dup) => (
          <React.Fragment key={dup}>
            {props.testimonials.map((item, i) => (
              <TestimonialCard key={`${dup}-${i}-${item.name}`} item={item} className="mx-auto" />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
