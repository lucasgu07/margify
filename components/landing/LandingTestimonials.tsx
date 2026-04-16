"use client";

import { useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import {
  TestimonialCard,
  TestimonialsColumn,
  type TestimonialItem,
} from "@/components/ui/testimonials-columns-1";
import { TestimonialsMarqueeRow } from "@/components/landing/TestimonialsMarqueeRow";

const testimonials: TestimonialItem[] = [
  {
    text: "Por fin vimos cuánto nos quedaba después de comisiones, envío y ads. El ROAS de Meta ya no nos engaña: el margen real está en Margify.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Valentina Ríos",
    role: "Dueña, tienda de indumentaria",
  },
  {
    text: "Conectamos TiendaNube en un rato y empezamos a ver rentabilidad por SKU. Cortamos dos productos que parecían estrellas y en realidad nos comían el margen.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Martín Acosta",
    role: "Fundador, ecommerce de hogar",
  },
  {
    text: "Las alertas por WhatsApp nos salvaron cuando el margen cayó en una campaña. Sin Excel y sin cruzar cuatro planillas distintas.",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    name: "Lucía Fernández",
    role: "COO, marca de cosmética",
  },
  {
    text: "Llevamos Shopify y MercadoLibre; tener ventas y costos en un solo lugar cambió cómo definimos precios y descuentos.",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    name: "Diego Morales",
    role: "Director comercial",
  },
  {
    text: "El asistente con IA nos marca por dónde empezar cuando algo se desvía. No reemplaza el criterio, pero acorta el tiempo de análisis.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Carla Méndez",
    role: "Ecommerce manager",
  },
  {
    text: "Para la agencia, el portal con accesos por cliente es clave: mismos números que el dueño ve, sin mezclar datos entre cuentas.",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    name: "Andrés Vega",
    role: "Director, agencia performance",
  },
  {
    text: "El predictor de cashflow nos ayudó a calmar la temporada alta: proyectamos entradas y salidas con lo que ya había pasado en el año.",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    name: "Marina Costa",
    role: "CFO, retail multicanal",
  },
  {
    text: "Pasamos de revisar reportes sueltos de cada red a un panel único. La discusión interna ya no es ‘quién tiene el número bueno’.",
    image: "https://randomuser.me/api/portraits/men/36.jpg",
    name: "Nicolás Pérez",
    role: "CEO, tienda deportiva",
  },
  {
    text: "Probamos el plan gratis, validamos el flujo con órdenes reales y después subimos de plan sin drama. El onboarding fue directo.",
    image: "https://randomuser.me/api/portraits/women/17.jpg",
    name: "Julieta Sánchez",
    role: "Emprendedora, bebidas",
  },
];

const testimonialsRow1 = testimonials.slice(0, 5);
const testimonialsRow2 = testimonials.slice(5, 9);

export function LandingTestimonials() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative z-10 py-14 md:py-20" aria-labelledby="testimonials-heading">
      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto flex max-w-[540px] flex-col items-center justify-center text-center">
          <Badge type="neutral" label="Testimonios" className="mb-4" />
          <h2
            id="testimonials-heading"
            className="text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            Lo que dicen las tiendas que ya midieron su margen de verdad
          </h2>
          <p className="mt-4 text-margify-muted md:text-lg">
            Equipos de ecommerce y agencias que unificaron ventas, costos y campañas con Margify.
          </p>
        </div>

        {reduceMotion ? (
          <>
            <div className="mx-auto mt-12 flex w-full max-w-xs flex-col items-center gap-5 md:hidden">
              {testimonials.map((item) => (
                <TestimonialCard key={item.name} item={item} />
              ))}
            </div>
            <div className="mx-auto mt-12 hidden max-w-6xl flex-col gap-6 md:flex">
              <div className="flex flex-wrap justify-center gap-4 md:gap-5">
                {testimonialsRow1.map((item) => (
                  <TestimonialCard key={item.name} item={item} />
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4 md:gap-5">
                {testimonialsRow2.map((item) => (
                  <TestimonialCard key={item.name} item={item} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Celular: una columna vertical centrada */}
            <div className="mx-auto mt-12 flex w-full max-w-full flex-col items-center justify-center md:hidden">
              <div className="flex max-h-[min(740px,70vh)] w-full justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
                <TestimonialsColumn testimonials={testimonials} duration={22} />
              </div>
            </div>

            {/* Tablet y desktop: dos filas horizontales en movimiento contrario */}
            <div className="mx-auto mt-12 hidden w-full max-w-full flex-col gap-3 md:flex md:gap-4">
              <TestimonialsMarqueeRow items={testimonialsRow1} direction="left" durationSec={40} />
              <TestimonialsMarqueeRow items={testimonialsRow2} direction="right" durationSec={34} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
