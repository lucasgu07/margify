"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { TestimonialItem } from "@/components/ui/testimonials-columns-1";

/** Tarjeta compacta para carruseles horizontales (tablet / desktop). */
function MarqueeTestimonialCard({ item, className }: { item: TestimonialItem; className?: string }) {
  return (
    <article
      className={cn(
        "w-[min(100%,17.5rem)] shrink-0 rounded-control border border-margify-border bg-margify-card p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(100,223,223,0.06)] sm:w-[18.5rem] sm:p-5 md:w-[19rem] md:p-6",
        className
      )}
    >
      <p className="text-xs leading-relaxed text-margify-muted sm:text-sm">{item.text}</p>
      <div className="mt-4 flex items-center gap-2.5 sm:mt-5 sm:gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas de demo */}
        <img
          width={40}
          height={40}
          src={item.image}
          alt=""
          loading="eager"
          decoding="async"
          className="h-9 w-9 shrink-0 rounded-full border border-margify-border object-cover sm:h-10 sm:w-10"
        />
        <div className="min-w-0 flex flex-col">
          <span className="text-xs font-semibold leading-tight tracking-tight text-white sm:text-sm">
            {item.name}
          </span>
          <span className="text-[0.65rem] leading-tight tracking-tight text-margify-muted sm:text-xs">
            {item.role}
          </span>
        </div>
      </div>
    </article>
  );
}

export function TestimonialsMarqueeRow({
  items,
  direction,
  durationSec = 38,
  className,
}: {
  items: TestimonialItem[];
  direction: "left" | "right";
  durationSec?: number;
  className?: string;
}) {
  const loop = [...items, ...items];

  return (
    <div
      className={cn("relative w-full overflow-hidden py-1", className)}
      style={{
        maskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
      }}
    >
      <motion.div
        className="flex w-max gap-4 md:gap-5"
        animate={direction === "left" ? { x: ["0%", "-50%"] } : { x: ["-50%", "0%"] }}
        transition={{
          duration: durationSec,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        {loop.map((item, i) => (
          <MarqueeTestimonialCard key={`${item.name}-${i}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
}
