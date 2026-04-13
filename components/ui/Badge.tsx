import { cn } from "@/lib/utils";

type BadgeType = "success" | "danger" | "warning" | "neutral";

const styles: Record<BadgeType, string> = {
  success: "bg-margify-cyan/15 text-margify-cyan border-margify-cyan/30",
  danger: "bg-margify-negative/15 text-margify-negative border-margify-negative/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  neutral: "bg-margify-cardAlt text-margify-muted border-margify-border",
};

export function Badge({
  label,
  type = "neutral",
  className,
}: {
  label: string;
  type?: BadgeType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[type],
        className
      )}
    >
      {label}
    </span>
  );
}
