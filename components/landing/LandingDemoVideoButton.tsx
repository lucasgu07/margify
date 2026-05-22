"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const VIMEO_EMBED_SRC =
  "https://player.vimeo.com/video/1194581557?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&title=0&byline=0&portrait=0";

export function LandingDemoVideoButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        className={buttonClassName("secondary", className)}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        ▶ Ver demo (100 seg)
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Video demo de Margify"
          onClick={close}
        >
          <div
            className="relative w-full max-w-[800px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-card border border-white/15 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
              <button
                type="button"
                onClick={close}
                className={cn(
                  "absolute right-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full",
                  "border border-white/20 bg-black/70 text-white transition-colors",
                  "hover:border-margify-cyan/50 hover:bg-black/90 hover:text-margify-cyan",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-margify-cyan"
                )}
                aria-label="Cerrar video"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              <div className="absolute inset-0 overflow-hidden bg-black">
                <iframe
                  title="Demo Margify en Vimeo"
                  src={VIMEO_EMBED_SRC}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  frameBorder={0}
                  className="absolute left-1/2 top-0 block h-full w-[140%] max-w-none -translate-x-1/2 border-0"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
