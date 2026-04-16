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
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-margify-muted">
          {integrationBrand ? (
            <IntegrationBrandIcon brand={integrationBrand} size="xs" />
          ) : null}
          <span>{title}</span>
        </p>
        {Icon ? (
          <Icon className={cn("h-5 w-5 shrink-0", secondaryClass)} aria-hidden />
        ) : null}
      </div>
      <p
        className={cn(
          "text-2xl font-bold tracking-tight text-margify-text md:text-3xl",
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
