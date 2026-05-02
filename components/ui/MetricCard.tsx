import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import type { IntegrationBrandId } from "@/lib/integration-brands";
import { cn, formatCurrency, formatCurrencyCompact, formatNumber } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  valueIsCurrency = true,
  suffix,
  change,
  icon: Icon,
  integrationBrand,
  className,
  valueClassName,
  progress,
  decimals,
  compact,
  dense = false,
}: {
  title: string;
  value: number;
  valueIsCurrency?: boolean;
  suffix?: string;
  change?: number;
  icon?: LucideIcon;
  /** Logo de plataforma junto al título (p. ej. Meta para gasto en ads). */
  integrationBrand?: IntegrationBrandId;
  className?: string;
  valueClassName?: string;
  /** 0–100 para barra visual opcional */
  progress?: number;
  /** Decimales del valor (por defecto: 1 si suffix es %, si no 2) */
  decimals?: number;
  /** Usa notación compacta para montos grandes (K / M). */
  compact?: boolean;
  /** Tipografía más chica (embed / columnas angostas, p. ej. preview en landing). */
  dense?: boolean;
}) {
  const valueDecimals = decimals ?? (suffix === "%" ? 1 : 2);
  const formatted = valueIsCurrency
    ? compact
      ? formatCurrencyCompact(value)
      : formatCurrency(value)
    : `${formatNumber(value, valueDecimals)}${suffix ?? ""}`;

  const showChangeFooter = change !== undefined;
  const secondaryClass = "text-margify-muted";

  return (
    <Card
      className={cn(
        "flex min-w-0 flex-col gap-3",
        dense && "gap-2 p-3.5 sm:p-4",
        className
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p
          className={cn(
            "flex min-w-0 items-center gap-1.5 font-medium text-margify-muted",
            dense ? "text-xs sm:text-[13px]" : "text-sm"
          )}
        >
          {integrationBrand ? (
            <IntegrationBrandIcon brand={integrationBrand} size="xs" />
          ) : null}
          <span className="min-w-0 leading-snug">{title}</span>
        </p>
        {Icon ? (
          <Icon
            className={cn("shrink-0", dense ? "h-4 w-4 sm:h-5 sm:w-5" : "h-5 w-5", secondaryClass)}
            aria-hidden
          />
        ) : null}
      </div>
      <p
        className={cn(
          "min-w-0 max-w-full font-bold tabular-nums tracking-tight text-margify-text leading-tight",
          dense
            ? "text-[13px] sm:text-sm md:text-base lg:text-lg"
            : "text-2xl md:text-3xl",
          valueClassName
        )}
      >
        {formatted}
      </p>
      {showChangeFooter ? (
        <p className={cn("text-xs font-medium", secondaryClass)}>
          {change > 0 ? "+" : ""}
          {formatNumber(change, 1)}% vs. período anterior
        </p>
      ) : null}
      {progress !== undefined ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-margify-border">
          <div
            className="h-full rounded-full bg-margify-muted/60 transition-all duration-margify"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </Card>
  );
}
