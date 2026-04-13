"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DateRangeKey } from "@/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ranges: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Esta semana" },
  { key: "month", label: "Este mes" },
  { key: "30d", label: "Últimos 30 días" },
];

export function Header({
  userName,
  dateRange,
  onDateRangeChange,
  showConnect,
  onConnect,
}: {
  userName: string;
  dateRange: DateRangeKey;
  onDateRangeChange: (r: DateRangeKey) => void;
  showConnect?: boolean;
  onConnect?: () => void;
}) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-margify-border pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          {greeting}, {userName}
        </h1>
        <p className="mt-1 text-sm text-margify-muted">
          {formatDate(new Date(), "long")}
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {showConnect ? (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 border-margify-cyan/40 text-margify-cyan"
            onClick={onConnect}
          >
            <Plus className="h-4 w-4" />
            Conectar plataforma
          </Button>
        ) : null}
        <div className="flex flex-wrap gap-1 rounded-control border border-margify-border bg-margify-card p-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onDateRangeChange(r.key)}
              className={cn(
                "rounded-control px-3 py-1.5 text-xs font-medium transition-all duration-margify md:text-sm",
                dateRange === r.key
                  ? "bg-margify-cyan/15 text-margify-cyan"
                  : "text-margify-muted hover:text-margify-text"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
