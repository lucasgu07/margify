"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { buttonClassName } from "@/components/ui/Button";

type CostCard = {
  emoji: string;
  title: string;
  description: string;
  highlight: string;
  footnote: string;
};

const CARDS: CostCard[] = [
  {
    emoji: "🎯",
    title: "Una campaña detectada",
    description: "Si Margify identifica una campaña perdiendo USD 500 al mes y la pausás,",
    highlight: "19x",
    footnote: "el plan Pro se pagó 19 veces ese mes",
  },
  {
    emoji: "📦",
    title: "Un producto con margen negativo",
    description: "Si descubrís que un producto pierde USD 8 por unidad y vendés 200 por mes,",
    highlight: "USD 1.600",
    footnote: "dejás de perder eso cada mes",
  },
  {
    emoji: "⏱️",
    title: "Tiempo en reportes",
    description: "Si ahorrás 4 horas por semana de armar reportes en Excel,",
    highlight: "16 horas",
    footnote: "por mes para enfocarte en vender",
  },
];

export function LandingCostComparison() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="costo-vs-ahorro"
      className="relative z-10 scroll-mt-32 py-14 md:py-20"
      aria-labelledby="cost-comparison-heading"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="cost-comparison-heading"
            className="text-[28px] font-bold leading-tight text-white"
          >
            USD 26 al mes. Se paga solo la primera semana.
          </h2>
          <p className="mt-3 text-neutral-400">
            Compará el costo de Margify con lo que podés dejar de perder.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.1 }}
              className="rounded-xl border border-[#222222] bg-[#111111] p-6 text-center"
            >
              <span
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#64DFDF20] text-xl"
                aria-hidden
              >
                {card.emoji}
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{card.description}</p>
              <p className="mt-4 text-3xl font-bold text-[#64DFDF]">{card.highlight}</p>
              <p className="mt-1 text-xs text-neutral-500">{card.footnote}</p>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Margify Pro cuesta <span className="font-bold text-[#64DFDF]">USD 26</span> al mes. Menos
          que una cena.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/auth/register"
            className={buttonClassName(
              "primary",
              "border-0 bg-[#64DFDF] px-8 py-3 font-bold text-black hover:bg-[#64DFDF]/90"
            )}
          >
            Empezar gratis ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
