/**
 * Superficies translúcidas solo para la home: dejan ver el fondo de partículas/estrellas
 * con blur; el texto va a opacidad plena vía colores existentes (+ ajustes puntuales).
 */
export const landingGlassNav =
  "isolate border border-teal-950/45 bg-[rgba(10,46,46,0.70)] shadow-[0_12px_40px_rgba(0,0,0,0.38)] backdrop-blur-[30px] [-webkit-backdrop-filter:blur(30px)] backdrop-saturate-150";

export const landingGlassPanel =
  "border-white/11 bg-black/48 shadow-[0_12px_44px_rgba(0,0,0,0.42)] backdrop-blur-[16px] backdrop-saturate-150";

export const landingGlassPanelHover =
  "transition-colors duration-margify hover:border-white/16 hover:bg-black/54";

export const landingGlassFaq =
  "border-white/11 bg-black/46 backdrop-blur-[14px] backdrop-saturate-150 hover:border-white/15";

export const landingGlassFaqOpen =
  "border-margify-cyan/38 bg-black/52 shadow-[0_0_0_1px_rgba(100,223,223,0.12)] backdrop-blur-[16px] backdrop-saturate-150";

export const landingGlassPricingToggle =
  "border-white/12 bg-black/45 backdrop-blur-xl backdrop-saturate-150";

/** Badge neutral en home: borde translúcido, texto igual de legible. */
export const landingGlassBadge =
  "border-white/14 !bg-black/44 text-neutral-200 backdrop-blur-md";

/** Texto secundario un poco más claro sobre vidrio oscuro */
export const landingGlassBodyText = "text-neutral-300";

/** Tooltips de gráficos sobre fondo con estrellas (dashboard). */
export const dashboardChartTooltipClass =
  "rounded-control border border-white/12 bg-black/55 px-3 py-2 text-xs shadow-lg backdrop-blur-md";
