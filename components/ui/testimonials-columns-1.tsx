"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { landingGlassPanel, landingGlassPanelHover } from "@/lib/landing-glass-styles";

export type TestimonialItem = {
  text: string;
  image: string;
  name: string;
  role: string;
};

export function TestimonialCard({ item, className }: { item: TestimonialItem; className?: string }) {
  return (
    <article
      className={cn(
        "w-full max-w-xs rounded-control border p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(100,223,223,0.06)] md:p-7",
        landingGlassPanel,
        landingGlassPanelHover,
        className
      )}
    >
      <p className="text-sm leading-relaxed text-neutral-300">{item.text}</p>
      <div className="mt-5 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas de demo */}
        <img
          width={40}
          height={40}
          src={item.image}
          alt=""
          loading="eager"
          decoding="async"
          className="h-10 w-10 shrink-0 rounded-full border border-white/15 object-cover"
        />
        <div className="min-w-0 flex flex-col">
          <span className="text-sm font-semibold leading-tight tracking-tight text-white">{item.name}</span>
          <span className="text-xs leading-tight tracking-tight text-neutral-400">{item.role}</span>
        </div>
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
        "min-h-0 w-full max-w-xs shrink-0 overflow-hidden",
        "mx-auto flex-none",
        props.className
      )}
    >
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex w-full flex-col items-center gap-5 pb-5"
      >
        {[0, 1].map((dup) => (
          <React.Fragment key={dup}>
            {props.testimonials.map((item, i) => (
              <TestimonialCard key={`${dup}-${i}-${item.name}`} item={item} className="mx-auto" />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
