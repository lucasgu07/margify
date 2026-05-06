import { cn } from "@/lib/utils";

/**
 * Contenedor de dos o más controles tocables en el mismo bloque ("cuadrante").
 * El movimiento y la sombra en hover se aplican al grupo entero vía `group-hover`,
 * no a cada hijo por separado. Cada bloque con esta clase es independiente.
 */
export const multiTouchClusterClasses = cn(
  "group",
  "transition-[transform,box-shadow] duration-margify ease-out",
  "motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:shadow-lg motion-safe:group-hover:shadow-black/25"
);

/** Botones dentro del cluster: feedback táctil sin escala propia en hover (lo lleva el padre). */
export const multiTouchClusterChildButtonClasses = "touch-manipulation";
