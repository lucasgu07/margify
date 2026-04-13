import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  valueIsCurrency = true,
  suffix,
  change,
  changeType,
  icon: Icon,
  className,
  valueClassName,
  progress,
}: {
  title: string;
  value: number;
  valueIsCurrency?: boolean;
  suffix?: string;
  change?: number;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  className?: string;
  valueClassName?: string;
  /** 0–100 para barra visual opcional */
  progress?: number;
}) {
  const formatted = valueIsCurrency
    ? formatCurrency(value)
    : `${formatNumber(value, suffix === "%" ? 1 : 2)}${suffix ?? ""}`;

  const changeColor =
    changeType === "positive"
      ? "text-margify-cyan"
      : changeType === "negative"
        ? "text-margify-negative"
        : "text-margify-muted";

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-margify-muted">{title}</p>
        {Icon ? (
          <Icon className="h-5 w-5 shrink-0 text-margify-cyan/80" aria-hidden />
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
      {change !== undefined && changeType ? (
        <p className={cn("text-xs font-medium", changeColor)}>
          {change > 0 ? "+" : ""}
          {formatNumber(change, 1)}% vs. período anterior
        </p>
      ) : null}
      {progress !== undefined ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-margify-border">
          <div
            className="h-full rounded-full bg-margify-cyan transition-all duration-margify"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </Card>
  );
}
