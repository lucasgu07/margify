import { costTotalsFromOrders } from "@/lib/calculations";

import type { AdsPlatformScope, Campaign, Order } from "@/types";
import { ADS_PLATFORM_SHORT_LABEL } from "@/lib/integration-brands";



/** Alineado con el filtro de tienda del dashboard (`all` o id de tienda). */

export type AdvisorStoreScope = "all" | string;

import {

  buildCashflowEntries,

  buildProductProfits,

  cashflowSummary,

  channelProfitRows,

  getDashboardMetrics,

  mockAlertsHistory,

  mockCampaigns,

  mockOrders,

} from "@/lib/mock-data";

import { formatCurrency } from "@/lib/utils";



export type AdvisorInsights = {

  subtitle: string;

  tips: string[];

  ctaHref: string;

  ctaLabel: string;

};



/** Campañas para métricas del dashboard (todas las plataformas de ads, filtradas por tienda). */
function campaignsForStoreScope(storeScope: AdvisorStoreScope): Campaign[] {
  return storeScope === "all"
    ? mockCampaigns
    : mockCampaigns.filter((c) => c.store_id === storeScope);
}

/** Campañas para la página Campañas (tienda + plataforma de ads). */
function campaignsForCampanasScope(
  storeScope: AdvisorStoreScope,
  adsPlatform: AdsPlatformScope
): Campaign[] {
  return campaignsForStoreScope(storeScope).filter((c) => c.platform === adsPlatform);
}



function fmtPct(n: number) {

  return `${n.toFixed(1)}%`;

}



function fmtX(n: number) {

  return `${n.toFixed(2)}x`;

}



/** Completa hasta 3 tips; evita duplicados por texto idéntico */

function ensureThree(

  primary: string[],

  fallback: (i: number) => string

): string[] {

  const out: string[] = [];

  for (const t of primary) {

    if (t && !out.includes(t)) out.push(t);

    if (out.length >= 3) break;

  }

  let i = 0;

  while (out.length < 3) {

    const next = fallback(i);

    if (!out.includes(next)) out.push(next);

    i += 1;

  }

  return out.slice(0, 3);

}



/**

 * Mezcla oportunidades (crecimiento) y puntos a vigilar.

 * Prioriza al menos un mensaje positivo cuando `growth` trae contenido.

 */

function mergeGrowthAndAttention(

  growth: string[],

  attention: string[],

  pad: (i: number) => string

): string[] {

  const g = growth.filter(Boolean);

  const a = attention.filter(Boolean);

  const ordered: string[] = [];

  let gi = 0;

  let ai = 0;

  if (g[gi]) {

    ordered.push(g[gi]);

    gi += 1;

  }

  if (a[ai]) {

    ordered.push(a[ai]);

    ai += 1;

  }

  if (g[gi]) {

    ordered.push(g[gi]);

    gi += 1;

  }

  while (ordered.length < 3 && (gi < g.length || ai < a.length)) {

    if (g[gi]) {

      ordered.push(g[gi]);

      gi += 1;

    } else if (a[ai]) {

      ordered.push(a[ai]);

      ai += 1;

    } else break;

  }

  return ensureThree(ordered, pad);

}



export function buildDashboardAdvisorInsights(

  orders: Order[],

  storeScope: AdvisorStoreScope

): AdvisorInsights {

  const m = getDashboardMetrics(orders, storeScope === "all" ? null : storeScope);

  const campaigns = campaignsForStoreScope(storeScope);

  const active = campaigns.filter((c) => c.status === "active");

  const pool = active.length > 0 ? active : campaigns;

  const bestCamp =

    pool.length > 0 ? [...pool].sort((a, b) => b.roas_real - a.roas_real)[0] : undefined;

  const worstCamp =

    active.length > 0

      ? [...active].sort((a, b) => a.roas_real - b.roas_real)[0]

      : [...campaigns].sort((a, b) => a.roas_real - b.roas_real)[0];

  const products = buildProductProfits(orders);

  const bestProduct =

    products.length > 0

      ? [...products].sort((a, b) => b.margin_percent - a.margin_percent)[0]

      : undefined;

  const worstProduct = [...products].sort((a, b) => a.margin_percent - b.margin_percent)[0];

  const channels = channelProfitRows(orders);

  const worstCh = [...channels].sort((a, b) => a.margin_percent - b.margin_percent)[0];

  const bestCh = [...channels].sort((a, b) => b.margin_percent - a.margin_percent)[0];



  const growth: string[] = [];

  const attention: string[] = [];



  if (bestCamp && bestCamp.roas_real >= 2.2 && bestCamp.spend >= 800) {

    growth.push(

      `"${bestCamp.campaign_name}" viene fuerte: ROAS real ${fmtX(bestCamp.roas_real)} y ${formatCurrency(bestCamp.attributed_revenue)} en ventas atribuidas. Si stock y margen acompañan, probá subir presupuesto de forma gradual (10–20%) y medí CPA a 48–72 h.`

    );

  }



  if (m.marginPercent >= 18) {

    growth.push(

      `Tu margen neto ${fmtPct(m.marginPercent)} y MER ${fmtX(m.mer)} dan margen para invertir en ads o inventario sin apretar la cuenta: priorizá donde ya ves retorno comprobado.`

    );

  } else if (bestProduct && bestProduct.margin_percent >= 22) {

    growth.push(

      `"${bestProduct.name}" lidera margen (${fmtPct(bestProduct.margin_percent)} sobre ${formatCurrency(bestProduct.revenue)}): es buen candidato para bundles, upsell o remarketing.`

    );

  }



  if (bestCh && channels.length > 1 && worstCh && bestCh.channel !== worstCh.channel) {

    growth.push(

      `${bestCh.channel} es tu canal más rentable (${fmtPct(bestCh.margin_percent)} de margen). Reforzá ofertas o creatividades ahí antes de escalar en ${worstCh.channel}.`

    );

  }



  if (worstCamp) {

    const gap = worstCamp.roas_platform - worstCamp.roas_real;

    const isDifferentWorst = !bestCamp || worstCamp.id !== bestCamp.id;

    if (isDifferentWorst || worstCamp.roas_real < 2) {

      attention.push(

        `La campaña "${worstCamp.campaign_name}" tiene ROAS real ${fmtX(worstCamp.roas_real)}` +

          (gap > 0.3

            ? ` (${gap.toFixed(2)} puntos por debajo del que reporta la plataforma). Revisá creativos, audiencias o pausala si el gasto sigue alto.`

            : `. Si el gasto (${formatCurrency(worstCamp.spend)}) no compensa, bajá puja o reasigná presupuesto a mejor ROAS.`)

      );

    }

  }



  if (worstProduct && (!bestProduct || worstProduct.id !== bestProduct.id)) {

    attention.push(

      `El producto con menor margen en este período es "${worstProduct.name}" (${fmtPct(worstProduct.margin_percent)} sobre ${formatCurrency(worstProduct.revenue)} en ventas). Ajustá costo o precio antes de escalar stock.`

    );

  }



  if (worstCh && channels.length > 1 && bestCh && worstCh.channel !== bestCh.channel) {

    attention.push(

      `${worstCh.channel} muestra el margen más bajo (${fmtPct(worstCh.margin_percent)} vs. ${fmtPct(bestCh.margin_percent)} en ${bestCh.channel}). Enfocá promos o mix donde la ganancia neta sea mayor.`

    );

  }



  const subtitle = `Sugerencias con tus números actuales: ${orders.length} órdenes en el rango, margen neto ${fmtPct(m.marginPercent)} y MER ${fmtX(m.mer)}.`;



  const tips = mergeGrowthAndAttention(growth, attention, (i) =>

    i === 0

      ? `Tu ticket promedio es ${formatCurrency(m.aov)} y el ROAS real agregado ${fmtX(m.trueRoas)}: si el margen ${fmtPct(m.marginPercent)} queda corto, revisá costos fijos en Configuración.`

      : i === 1

        ? `El gasto en ads atribuido suma ${formatCurrency(m.adSpendAttributed)} en el período. Comparalo con ganancia neta (${formatCurrency(m.netProfit)}) para ver cuánto queda después de publicidad.`

        : "Conectá todas las tiendas en Configuración para que el dashboard refleje ventas y costos sin huecos."

  );



  return {

    subtitle,

    tips,

    ctaHref: "/dashboard/rentabilidad",

    ctaLabel: "Ver rentabilidad detallada",

  };

}



export function buildRentabilidadAdvisorInsights(orders: Order[]): AdvisorInsights {

  const m = getDashboardMetrics(orders, null);

  const totalSales = orders.reduce((a, o) => a + o.revenue, 0);

  const t = costTotalsFromOrders(orders);

  const buckets = [

    { name: "costo de producto", value: t.product },

    { name: "comisiones de pago", value: t.payment },

    { name: "envío", value: t.shipping },

    { name: "publicidad atribuida", value: t.ads },

  ].filter((b) => b.value > 0);

  const sortedBuckets = [...buckets].sort((a, b) => b.value - a.value);

  const topCost = sortedBuckets[0];

  const channels = channelProfitRows(orders);

  const worstCh = [...channels].sort((a, b) => a.margin_percent - b.margin_percent)[0];

  const bestCh = [...channels].sort((a, b) => b.margin_percent - a.margin_percent)[0];



  const growth: string[] = [];

  const attention: string[] = [];



  if (m.marginPercent >= 20 && m.netProfit > 0) {

    growth.push(

      `Ganancia neta ${formatCurrency(m.netProfit)} con margen ${fmtPct(m.marginPercent)}: la estructura acompaña. Podés destinar parte del excedente a inventario o campañas ya probadas en lugar de solo recortar costos.`

    );

  }



  if (bestCh && channels.length > 1) {

    growth.push(

      `${bestCh.channel} concentra tu mejor margen (${fmtPct(bestCh.margin_percent)}). Si querés crecer con control, replicá allí el mix de productos y promos que ya funciona.`

    );

  }



  if (topCost && totalSales > 0) {

    attention.push(

      `El mayor peso de costos sobre tus ventas (${formatCurrency(totalSales)}) viene de ${topCost.name}: ${formatCurrency(topCost.value)} (${fmtPct((topCost.value / totalSales) * 100)} del total). Es la palanca más fuerte si buscás ganar más sin subir precios en todo el catálogo.`

    );

  }



  if (worstCh && bestCh && worstCh.channel !== bestCh.channel) {

    attention.push(

      `${worstCh.channel} aporta margen ${fmtPct(worstCh.margin_percent)} frente a ${fmtPct(bestCh.margin_percent)} en ${bestCh.channel}. Valuá mover inventario o inversión publicitaria hacia el canal más rentable.`

    );

  }



  attention.push(

    `En el período filtrado, ${fmtPct(m.marginPercent)} de las ventas queda como margen después de costos variables: cada mejora de un punto en COGS o comisiones se nota en toda la curva.`

  );



  return {

    subtitle: `Análisis de rentabilidad con ${orders.length} órdenes: desglose de costos y comparación por canal.`,

    tips: mergeGrowthAndAttention(growth, attention, (i) =>

      i === 0

        ? "Revisá el gráfico de torta: ocultá conceptos poco relevantes para ver cómo se redistribuye el resto."

        : "El detalle en tabla muestra % sobre ventas por concepto: usalo para negociar con proveedores o pasarelas."

    ),

    ctaHref: "/dashboard/productos",

    ctaLabel: "Ir a rentabilidad por producto",

  };

}



export function buildCampanasAdvisorInsights(
  storeScope: AdvisorStoreScope,
  adsPlatform: AdsPlatformScope
): AdvisorInsights {
  const campaigns = campaignsForCampanasScope(storeScope, adsPlatform);

  const active = campaigns.filter((c) => c.status === "active");

  const spend = campaigns.reduce((a, c) => a + c.spend, 0);

  const attr = campaigns.reduce((a, c) => a + c.attributed_revenue, 0);

  const avgRoas = spend > 0 ? attr / spend : 0;



  const bestActive =

    active.length > 0 ? [...active].sort((a, b) => b.roas_real - a.roas_real)[0] : undefined;

  const worstActive = [...active].sort((a, b) => a.roas_real - b.roas_real)[0];

  const highSpendLowRoas = [...active]

    .filter((c) => c.spend > 2000 && c.roas_real < 2)

    .sort((a, b) => b.spend - a.spend)[0];

  const biggestGap = [...campaigns]

    .map((c) => ({ c, gap: c.roas_platform - c.roas_real }))

    .sort((a, b) => b.gap - a.gap)[0];



  const growth: string[] = [];

  const attention: string[] = [];



  if (bestActive && bestActive.roas_real >= 2.3 && bestActive.spend >= 1000) {

    const conv = bestActive.conversions ?? 0;

    growth.push(

      `"${bestActive.campaign_name}" destaca con ROAS real ${fmtX(bestActive.roas_real)} y ${formatCurrency(bestActive.attributed_revenue)} atribuidos${conv ? ` (~${conv} conversiones)` : ""}. Si el CPA se mantiene estable, tiene sentido probar más presupuesto en tramos cortos y medir.`

    );

  }



  if (biggestGap && biggestGap.gap <= 0.2 && biggestGap.c.roas_real >= 2) {

    growth.push(

      `En "${biggestGap.c.campaign_name}" el ROAS real (${fmtX(biggestGap.c.roas_real)}) está alineado con la plataforma: buena señal de atribución y base para escalar con menos sorpresas en el backoffice.`

    );

  }



  if (worstActive && (!bestActive || worstActive.id !== bestActive.id)) {

    const conv = worstActive.conversions ?? 0;

    const cpa = conv > 0 ? worstActive.spend / conv : worstActive.spend;

    attention.push(

      `Entre las activas, "${worstActive.campaign_name}" tiene el ROAS real más bajo (${fmtX(worstActive.roas_real)}), con gasto ${formatCurrency(worstActive.spend)} y ~${conv} conversiones (CPA ~${formatCurrency(cpa)}). Priorizá optimizar o pausar si no mejora.`

    );

  }



  if (highSpendLowRoas) {

    attention.push(

      `Alto gasto (${formatCurrency(highSpendLowRoas.spend)}) con ROAS real ${fmtX(highSpendLowRoas.roas_real)} en "${highSpendLowRoas.campaign_name}": revisá landing, oferta y público antes de mantener el presupuesto.`

    );

  }



  if (biggestGap && biggestGap.gap > 0.25) {

    attention.push(

      `En "${biggestGap.c.campaign_name}" el ROAS de plataforma (${fmtX(biggestGap.c.roas_platform)}) supera al real (${fmtX(biggestGap.c.roas_real)}). Cruzá con ventas en tu backoffice para ajustar atribución y expectativas.`

    );

  }



  return {

    subtitle: `${ADS_PLATFORM_SHORT_LABEL[adsPlatform]} Ads · Basado en ${campaigns.length} campaña${campaigns.length === 1 ? "" : "s"} (${active.length} activas): ROAS medio ponderado ~${fmtX(avgRoas)} y gasto total ${formatCurrency(spend)}.`,

    tips: mergeGrowthAndAttention(growth, attention, (i) =>
      i === 0
        ? `Compará ROAS real vs. ${ADS_PLATFORM_SHORT_LABEL[adsPlatform]} en la tabla: diferencias grandes suelen indicar ventas no atribuidas o ventanas de conversión distintas.`
        : "Subí presupuesto solo donde el ROAS real sea estable y el volumen de conversiones lo justifique."
    ),

    ctaHref: "/dashboard/rentabilidad",

    ctaLabel: "Ver impacto en rentabilidad",

  };

}



export function buildProductosAdvisorInsights(orders: Order[]): AdvisorInsights {

  const products = buildProductProfits(orders);

  const byMarginAsc = [...products].sort((a, b) => a.margin_percent - b.margin_percent);

  const byMarginDesc = [...byMarginAsc].reverse();

  const worst = byMarginAsc[0];

  const best = byMarginDesc[0];

  const worst3 = byMarginAsc.slice(0, 3);

  const byVolume = [...products].sort((a, b) => b.units_sold - a.units_sold);

  const volLowMargin = byVolume.find((p) => p.margin_percent < 20 && p.units_sold >= 3);

  const topVolumeOk =

    byVolume[0] && byVolume[0].margin_percent >= 22 ? byVolume[0] : undefined;



  const growth: string[] = [];

  const attention: string[] = [];



  if (best) {

    growth.push(

      `Mejor margen: "${best.name}" con ${fmtPct(best.margin_percent)} (${formatCurrency(best.profit)} sobre ${formatCurrency(best.revenue)}, ${best.units_sold} u.). Es tu carta fuerte para campañas de conversión y bundles.`

    );

  }



  if (topVolumeOk && (!best || topVolumeOk.id !== best.id)) {

    growth.push(

      `"${topVolumeOk.name}" combina volumen (${topVolumeOk.units_sold} u.) con margen sólido (${fmtPct(topVolumeOk.margin_percent)}): ideal para destacarlo en el shop y en ads.`

    );

  }



  if (worst) {

    attention.push(

      `A vigilar: "${worst.name}" con ${fmtPct(worst.margin_percent)} (${formatCurrency(worst.profit)} de ganancia sobre ${formatCurrency(worst.revenue)}, ${worst.units_sold} u.). Revisá costo cargado o precio.`

    );

  }



  if (worst3.length >= 2) {

    attention.push(

      `Los tres SKU más débiles por margen: ${worst3.map((p) => `"${p.name}" (${fmtPct(p.margin_percent)})`).join(", ")}. Atacá primero el que más peso tenga en ventas.`

    );

  }



  if (volLowMargin) {

    attention.push(

      `"${volLowMargin.name}" vende ${volLowMargin.units_sold} unidades pero margen ${fmtPct(volLowMargin.margin_percent)}: volumen alto con poco margen arrastra toda la cuenta.`

    );

  }



  return {

    subtitle: `${products.length} productos con ventas en el período filtrado.`,

    tips: mergeGrowthAndAttention(growth, attention, (i) =>

      i === 0

        ? "Editá costo en la tabla y mirá cómo se recalcula ganancia y margen % al instante."

        : "Cruzá estos SKU con Rentabilidad global para ver si el problema es producto o canal."

    ),

    ctaHref: "/dashboard/rentabilidad",

    ctaLabel: "Ver comparativa de costos",

  };

}



export function buildCashflowAdvisorInsights(orders: Order[] = mockOrders): AdvisorInsights {

  const entries = buildCashflowEntries(orders);

  const summary = cashflowSummary(entries);

  const byMethod = entries.reduce(

    (acc, e) => {

      acc[e.payment_method] = (acc[e.payment_method] ?? 0) + e.amount;

      return acc;

    },

    {} as Record<string, number>

  );

  const mp = byMethod["Mercado Pago"] ?? 0;

  const total = Object.values(byMethod).reduce((a, b) => a + b, 0);

  const pending = entries.filter((e) => e.status !== "Cobrado").length;



  const growth: string[] = [];

  const attention: string[] = [];



  if (summary.thisWeek > 0 && summary.thisWeek >= summary.nextWeek * 0.85) {

    growth.push(

      `Esta semana proyectás cobros fuertes (~${formatCurrency(summary.thisWeek)}): buen momento para reponer stock o pagar proveedores sin apretar caja si el ritmo se mantiene.`

    );

  } else if (summary.nextWeek > summary.thisWeek * 1.15 && summary.nextWeek > 0) {

    growth.push(

      `La próxima semana viene con más entrada proyectada (~${formatCurrency(summary.nextWeek)} vs. ~${formatCurrency(summary.thisWeek)}): podés planificar compras o campañas apoyándote en ese calendario.`

    );

  }



  if (total > 0) {

    attention.push(

      `Mercado Pago concentra ${fmtPct((mp / total) * 100)} del monto proyectado (${formatCurrency(mp)} de ${formatCurrency(total)}): tené en cuenta el desfase típico de liquidación al planificar.`

    );

  }



  attention.push(

    `Cobros estimados esta semana ~${formatCurrency(summary.thisWeek)}; próxima ~${formatCurrency(summary.nextWeek)}. Usá el timeline para no comprometer stock sin liquidez.`

  );



  if (pending > 0) {

    attention.push(

      `${pending} de ${entries.length} líneas siguen pendientes o en proceso: seguí esos montos si necesitás cerrar proveedores esta semana.`

    );

  }



  return {

    subtitle: `Proyección con ${entries.length} movimientos recientes de cobro.`,

    tips: mergeGrowthAndAttention(growth, attention, (i) =>

      i === 0

        ? "Compará semanas con más proporción de tarjeta vs. MP para anticipar cuándo entra el efectivo."

        : "Si el cashflow se tensa, activá alertas de liquidez en Alertas."

    ),

    ctaHref: "/dashboard/alertas",

    ctaLabel: "Configurar alertas de liquidez",

  };

}



export function buildAlertasAdvisorInsights(): AdvisorInsights {

  const unread = mockAlertsHistory.filter((h) => !h.read).length;

  const recent = mockAlertsHistory[0];



  const growth: string[] = [];

  const attention: string[] = [];



  const positiveRecent = mockAlertsHistory.find(

    (h) =>

      h.alert_type === "weekly_summary" ||

      /\+[0-9]+%|subi[oó]|mejor|ganancia neta/i.test(h.message)

  );

  if (positiveRecent) {

    growth.push(

      `Buena señal en el historial: "${positiveRecent.message.slice(0, 120)}${positiveRecent.message.length > 120 ? "…" : ""}" — cuando los números vienen así, es buen momento para documentar qué cambió (campaña, precio o canal) y repetirlo.`

    );

  } else {

    growth.push(

      `Cuando ROAS y margen estén en verde varios días seguidos, usá Alertas para avisarte oportunidades (por ejemplo subir presupuesto en la campaña ganadora), no solo riesgos.`

    );

  }



  attention.push(

    `Tenés ${unread} alerta${unread === 1 ? "" : "s"} sin leer: revisalas para cerrar el circuito y no repetir el mismo disparador sin acción.`

  );



  if (recent) {

    attention.push(

      `La más reciente (${new Date(recent.triggered_at).toLocaleDateString("es-AR")}): ${recent.message}`

    );

  }



  attention.push(

    "Si una regla dispara muy seguido, subí el umbral o cambiá el canal a email para agrupar resúmenes."

  );



  return {

    subtitle: "Recomendaciones según tu historial de alertas y canales configurados.",

    tips: mergeGrowthAndAttention(growth, attention, (i) =>

      i === 0

        ? "WhatsApp requiere número verificado en Configuración para alertas críticas."

        : "Desactivá reglas que no vas a revisar: reduce ruido y da más peso al resto."

    ),

    ctaHref: "/dashboard/configuracion",

    ctaLabel: "WhatsApp e integraciones",

  };

}


