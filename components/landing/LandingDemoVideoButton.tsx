"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";

const VIMEO_EMBED =
  "https://player.vimeo.com/video/1194581557?autoplay=1&title=0&byline=0&portrait=0";

export function LandingDemoVideoButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback(() => {
    setSrc(VIMEO_EMBED);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setSrc("");
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) closeModal();
    },
    [closeModal]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeModal]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={buttonClassName("secondary", className)}
      >
        ▶ Ver demo — 100 seg
      </button>

      {open ? (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Demo de Margify"
        >
          <div className="relative w-full max-w-[900px]">
            <button
              type="button"
              onClick={closeModal}
              aria-label="Cerrar video"
              className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            >
              <X className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <div className="overflow-hidden rounded-xl">
              <iframe
                src={src}
                width="100%"
                style={{ aspectRatio: "16/9", display: "block" }}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Demo de Margify"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
