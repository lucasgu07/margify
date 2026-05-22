"use client";

import { cn } from "@/lib/utils";
import { TestimonialCard, type TestimonialItem } from "@/components/ui/testimonials-columns-1";

/** Misma tarjeta que la grilla (tamaño y tipografía unificados). */
function MarqueeTestimonialCard({ item, className }: { item: TestimonialItem; className?: string }) {
  return <TestimonialCard item={item} className={className} />;
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
      className={cn("relative w-full overflow-hidden py-1 contain-paint", className)}
      style={{
        maskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
      }}
    >
      <div
        className={cn(
          "flex w-max items-start gap-4 motion-gpu md:gap-5",
          direction === "left" ? "animate-marquee-x-left" : "animate-marquee-x-right"
        )}
        style={{ animationDuration: `${durationSec}s` }}
      >
        {loop.map((item, i) => (
          <MarqueeTestimonialCard key={`${item.name}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
