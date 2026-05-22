"use client";

import { cn } from "@/lib/utils";

export function CampaignOnOffSwitch({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Campaña activa, pulsar para pausar" : "Campaña pausada, pulsar para activar"}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-margify",
        on
          ? "justify-end border-margify-cyan/50 bg-margify-cyan"
          : "justify-start border-margify-border bg-margify-cardAlt",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <span
        aria-hidden
        className="block h-4 w-4 shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
      />
    </button>
  );
}
