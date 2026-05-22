"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Scroll global suave (rueda, trackpad y anclas #sección).
 * Áreas con scroll propio deben usar data-lenis-prevent.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const lenis = new Lenis({
      autoRaf: true,
      /** Lerp = menor latencia percibida que duration fijo (misma suavidad, más respuesta). */
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: true,
      syncTouchLerp: 0.08,
      allowNestedScroll: true,
      anchors: { offset: 128 },
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
