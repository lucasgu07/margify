"use client";

import { useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import {
  TestimonialCard,
  TestimonialsColumn,
  type TestimonialItem,
} from "@/components/ui/testimonials-columns-1";
import { TestimonialsMarqueeRow } from "@/components/landing/TestimonialsMarqueeRow";
import { landingGlassBadge, landingGlassBodyText } from "@/lib/landing-glass-styles";
import { cn } from "@/lib/utils";

/** Fotos naturales (stock) — rostro recortado, tono emprendedora LATAM. */
const testimonialPhoto = (id: string) =>
  `https://images.unsplash.com/${id}?w=80&h=80&fit=crop&crop=faces`;

const testimonials: TestimonialItem[] = [
  {
    text: "posta que antes mirábamos el roas de meta y después nos dabamos cuenta que no nos quedaba nada 😅 con margify por fin vemos lo que queda después de comisiones, envío y ads",
    image: testimonialPhoto("photo-1573496359142-b8d87734a5a2"),
    name: "Vale R.",
    role: "ropa online · montevideo",
  },
  {
    text: "conecté tiendanube en un toque y chau planilla. había dos productos que vendían banda pero el margen era una mugre, los bajamos y listo",
    name: "Tomi A.",
    role: "deco & hogar · palermo",
  },
  {
    text: "me llegó un whatsapp tipo 'che el margen de esta campaña se fue al piso' y pudimos frenar a tiempo. sin cruzar cuatro excels distintos, gracias a dios",
    image: testimonialPhoto("photo-1580489944761-15a19d654956"),
    name: "Lu Ferreyra",
    role: "skincare por ig · rosario",
  },
  {
    text: "tenemos shopify y meli y era un lío saber cuánto ganábamos posta. ahora precios y descuentos los vemos con números que cierran, no con feeling",
    name: "Diego M.",
    role: "electro · caba",
  },
  {
    text: "la ia no te reemplaza el criterio obvio pero cuando algo se desvía te dice por dónde mirar primero y no perdés media tarde en reportes",
    image: testimonialPhoto("photo-1534528741775-53994a69daeb"),
    name: "Carla M.",
    role: "ecommerce · cordoba",
  },
  {
    text: "somos agencia y el portal por cliente nos salvó: el dueño ve lo mismo que nosotros sin mezclar cuentas ni mandar capturas por drive",
    name: "Andrés V.",
    role: "performance · montevideo",
  },
  {
    text: "temporada alta siempre era nervios. con el cashflow proyectado por lo que ya pasó en el año respiramos un poco más tranquis",
    image: testimonialPhoto("photo-1544005313-94ddf0286df2"),
    name: "Marina C.",
    role: "multicanal · punta del este",
  },
  {
    text: "antes cada uno traía el número de su red y era discusión eterna. ahora hay un panel y la charla es otra",
    name: "Nico P.",
    role: "indumentaria deportiva · caba",
  },
  {
    text: "arranqué en el plan gratis con pedidos reales, cuando vi que cerraba subí de plan sin drama. el onboarding fue re directo",
    image: testimonialPhoto("photo-1438761681033-6461ffad8d80"),
    name: "Juli S.",
    role: "bebidas · colonia",
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
          <Badge type="neutral" label="Testimonios" className={cn("mb-4", landingGlassBadge)} />
          <h2
            id="testimonials-heading"
            className="text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            Lo que dicen las tiendas que ya midieron su margen de verdad
          </h2>
          <p className={cn("mt-4 md:text-lg", landingGlassBodyText)}>
            Tiendas y marcas de acá que dejaron de pelearse con el Excel y empezaron a mirar el margen posta.
          </p>
        </div>
      </div>

      {reduceMotion ? (
        <>
          <div className="mx-auto mt-12 flex w-full max-w-xs flex-col items-center gap-5 px-4 md:hidden">
            {testimonials.map((item) => (
              <TestimonialCard key={item.name} item={item} />
            ))}
          </div>
          <div className="mt-12 hidden w-full flex-col gap-6 px-4 md:flex md:px-6">
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
          <div className="mx-auto mt-12 flex w-full flex-col items-center justify-center px-4 md:hidden">
            <div
              className="flex max-h-[min(740px,70vh)] w-full justify-center overflow-hidden"
              style={{
                maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
              }}
            >
              <TestimonialsColumn testimonials={testimonials} duration={22} />
            </div>
          </div>

          <div className="mt-12 hidden w-full min-w-0 flex-col gap-3 md:flex md:gap-4">
            <TestimonialsMarqueeRow items={testimonialsRow1} direction="left" durationSec={40} />
            <TestimonialsMarqueeRow items={testimonialsRow2} direction="right" durationSec={34} />
          </div>
        </>
      )}
    </section>
  );
}
