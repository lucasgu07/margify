"use client";

import { cn } from "@/lib/utils";

const MARK_PX = { sm: 28, md: 36, lg: 52 } as const;

/** Texto debajo del isotipo (apilado). */
const wordmarkBelowClass = {
  sm: "text-xs font-bold tracking-tight",
  md: "text-sm font-bold tracking-tight",
  lg: "text-lg font-bold tracking-tight md:text-xl",
} as const;

/**
 * Isotipo en `/public/margify-logo.png` (ideal: PNG con alpha, sin fondo).
 * Usamos `<img>` nativo para que el navegador respete la transparencia sin pasar por el optimizador de Next.
 */
export function Logo({
  className,
  size = "md",
  showWordmark = true,
  priority = false,
  /** Alineación del bloque apilado (isotipo + texto). */
  align = "center",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  priority?: boolean;
  align?: "center" | "start";
}) {
  const box = MARK_PX[size];

  return (
    <span
      className={cn(
        "inline-flex flex-col",
        align === "start" ? "items-start" : "items-center",
        "gap-1",
        className
      )}
    >
      <span className="relative block shrink-0" style={{ width: box, height: box }}>
        {/* img nativo: evita re-encode del optimizador; el fondo lo define solo el PNG (alpha). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/margify-logo.png"
          alt="Margify"
          width={512}
          height={512}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
          className="h-full w-full object-contain object-center"
        />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "select-none leading-none text-white",
            wordmarkBelowClass[size]
          )}
        >
          Margify<span className="text-margify-cyan">.</span>
        </span>
      ) : null}
    </span>
  );
}
