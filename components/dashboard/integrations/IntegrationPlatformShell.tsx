"use client";

import type { ReactNode } from "react";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import type { IntegrationBrandId } from "@/lib/integration-brands";
import { cn } from "@/lib/utils";

export function IntegrationPlatformShell({
  brand,
  title,
  description,
  connected = false,
  soon = false,
  children,
}: {
  brand?: IntegrationBrandId;
  title: string;
  description: string;
  connected?: boolean;
  soon?: boolean;
  children?: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[12px] border border-[#222222] bg-[#111111] p-5 transition-[border-color] duration-150",
        soon
          ? "cursor-not-allowed opacity-50"
          : "motion-safe:hover:border-[#64DFDF]",
        connected && !soon && "border-l-[3px] border-l-[#64DFDF]"
      )}
    >
      <div className="flex items-start gap-3">
        {brand ? (
          <IntegrationBrandIcon brand={brand} size="md" withBackdrop={false} className="h-10 w-10 shrink-0" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {soon ? (
              <span className="rounded-full bg-margify-cardAlt px-2 py-0.5 text-xs font-medium text-margify-muted">
                Próximamente
              </span>
            ) : connected ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Conectada
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-margify-muted">{description}</p>
        </div>
      </div>
      {children ? <div className="mt-4 flex flex-1 flex-col gap-3">{children}</div> : null}
    </article>
  );
}
