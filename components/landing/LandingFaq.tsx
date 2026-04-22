"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    id: "conectar",
    q: "¿Qué tiendas y canales puedo conectar?",
    a: "Podés enlazar TiendaNube, Shopify, MercadoLibre y tus cuentas de publicidad (Meta, Google, TikTok). Las ventas y los datos de campañas se sincronizan para que veas rentabilidad con todo junto, no en silos.",
  },
  {
    id: "rentabilidad",
    q: "¿Cómo calcula Margify mi ganancia real?",
    a: "Partimos de tus ventas y restamos comisiones, envío, costo del producto, gastos fijos y lo que cargues de tu operación. El objetivo es que el margen refleje lo que realmente te queda, no un número aproximado de un solo canal.",
  },
  {
    id: "costos",
    q: "¿Tengo que cargar todos los costos a mano?",
    a: "Muchos datos vienen de las integraciones; el resto lo cargás vos cuando corresponde (por ejemplo gastos fijos o reglas por producto). Cuanto más completo esté el modelo, más preciso es el resultado.",
  },
  {
    id: "gratis",
    q: "¿Hay plan gratis?",
    a: "Sí. El plan Starter es gratuito con un volumen de órdenes acotado para que pruebes el flujo sin tarjeta. Los planes de pago amplían límites y funciones según lo que necesite tu tienda.",
  },
  {
    id: "cancelar",
    q: "¿Puedo cancelar o cambiar de plan en cualquier momento?",
    a: "Podés ajustar o cancelar tu suscripción según las condiciones de tu facturación. Si tenés dudas sobre tu caso, podés escribirnos por WhatsApp.",
  },
  {
    id: "ia",
    q: "¿Qué hace el asistente con IA?",
    a: "Te orienta sobre qué revisar cuando el margen se mueve, qué priorizar entre productos o canales y cómo interpretar señales del panel, sin reemplazar tu criterio de negocio.",
  },
] as const;

export function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="relative mx-auto max-w-3xl px-4 md:px-6">
      <div className="text-center">
        <h2
          id="faq-heading"
          className="text-3xl font-bold tracking-tight text-white md:text-4xl"
        >
          Preguntas frecuentes
        </h2>
        <p className="mt-3 text-margify-muted md:text-lg">
          Todo lo que necesitás saber sobre Margify antes de empezar.
        </p>
      </div>
      <ul className="mt-10 space-y-3 p-0" role="list">
        {faqs.map(({ id, q, a }) => {
          const isOpen = openId === id;
          const panelId = `faq-panel-${id}`;
          return (
            <li key={id} className="list-none">
              <div
                className={cn(
                  "overflow-hidden rounded-card border transition-colors duration-margify",
                  isOpen
                    ? "border-margify-cyan/35 bg-margify-cardAlt shadow-[0_0_0_1px_rgba(100,223,223,0.12)]"
                    : "border-margify-border bg-margify-card hover:border-margify-border/90"
                )}
              >
                <button
                  type="button"
                  id={`faq-trigger-${id}`}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left md:px-5 md:py-4"
                  onClick={() => setOpenId(isOpen ? null : id)}
                >
                  <span className="flex-1 text-base font-semibold leading-snug text-white md:text-[17px]">
                    {q}
                  </span>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-margify-border bg-margify-cardAlt text-margify-cyan transition-transform duration-margify",
                      isOpen && "rotate-45"
                    )}
                    aria-hidden
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={`faq-trigger-${id}`}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-margify ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="border-t border-margify-border/80 px-4 pb-4 pt-3 text-sm leading-relaxed text-margify-muted md:px-5 md:text-[15px]">
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
