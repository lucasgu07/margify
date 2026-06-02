"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/** Contenedor de tarjeta de integración: modo página (sin Card) o modo configuración legacy. */
export function IntegrationCardRoot({
  embedded,
  className,
  children,
}: {
  embedded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (embedded) {
    return <div className={cn("flex flex-col gap-3", className)}>{children}</div>;
  }
  return (
    <Card glass className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      {children}
    </Card>
  );
}
