import { landingGlassPanel, landingGlassPanelHover } from "@/lib/landing-glass-styles";
import { cn } from "@/lib/utils";

/** Misma sombra bisel que las tarjetas de testimonios en la landing. */
const dashboardGlassShadow =
  "shadow-[0_10px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(100,223,223,0.06)]";

export function Card({
  className,
  children,
  glass,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glass?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card p-5 transition-[box-shadow,transform,border-color,background-color] duration-margify",
        glass
          ? cn(landingGlassPanel, landingGlassPanelHover, dashboardGlassShadow)
          : "border border-margify-border bg-margify-card hover:shadow-lg hover:shadow-black/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-margify-text", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("mt-1 text-sm text-margify-muted", className)}>{children}</p>
  );
}
