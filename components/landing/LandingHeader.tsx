"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navLinkClassName =
  "text-sm font-medium text-margify-muted transition-colors duration-margify hover:text-white";

const shellClassName =
  "mx-auto max-w-6xl rounded-2xl border border-margify-border/80 bg-margify-bg/75 shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-xl md:rounded-3xl";

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-2 z-50 bg-transparent px-3 pt-2 md:top-4 md:px-6 md:pt-4">
      {/* Desktop: mismo layout que antes (md+) */}
      <div className={cn(shellClassName, "hidden md:block")}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 md:px-6 md:py-3.5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2 md:gap-x-8">
            <Link href="/" className="shrink-0">
              <Logo priority />
            </Link>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Secciones de la página">
              <a href="#como-funciona" className={navLinkClassName}>
                Cómo funciona
              </a>
              <a href="#funciones" className={navLinkClassName}>
                Funciones
              </a>
              <a href="#planes" className={navLinkClassName}>
                Planes
              </a>
              <a href="#faq" className={navLinkClassName}>
                FAQ
              </a>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-margify-muted transition-colors duration-margify hover:text-white"
            >
              Ingresar
            </Link>
            <Link
              href="/auth/register"
              className={buttonClassName("primary", "px-4 py-2 text-sm shadow-[0_4px_20px_rgba(100,223,223,0.25)]")}
            >
              Registrarse
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: logo + Ingresar / Registrarse en la barra; menú solo para secciones */}
      <div className={cn(shellClassName, "md:hidden")}>
        <div className="flex items-center justify-between gap-2 px-2 py-2 sm:gap-3 sm:px-3">
          <Link href="/" className="min-w-0 shrink" onClick={() => setMenuOpen(false)}>
            <Logo priority size="sm" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <Link
              href="/auth/login"
              className="whitespace-nowrap px-1 text-xs font-medium text-margify-muted transition-colors duration-margify hover:text-white sm:px-2 sm:text-sm"
            >
              Ingresar
            </Link>
            <Link
              href="/auth/register"
              className={buttonClassName(
                "primary",
                "shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs shadow-[0_4px_16px_rgba(100,223,223,0.22)] sm:px-3 sm:py-2 sm:text-sm"
              )}
            >
              Registrarse
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-margify-border/80 bg-margify-black/40 text-white transition-colors hover:border-margify-cyan/40 hover:text-margify-cyan"
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div id="landing-mobile-nav" className="border-t border-margify-border/60 px-3 pb-3 pt-1">
            <nav className="flex flex-col gap-0.5" aria-label="Secciones de la página">
              <a
                href="#como-funciona"
                className={cn(navLinkClassName, "rounded-control px-2 py-2.5")}
                onClick={() => setMenuOpen(false)}
              >
                Cómo funciona
              </a>
              <a
                href="#funciones"
                className={cn(navLinkClassName, "rounded-control px-2 py-2.5")}
                onClick={() => setMenuOpen(false)}
              >
                Funciones
              </a>
              <a
                href="#planes"
                className={cn(navLinkClassName, "rounded-control px-2 py-2.5")}
                onClick={() => setMenuOpen(false)}
              >
                Planes
              </a>
              <a
                href="#faq"
                className={cn(navLinkClassName, "rounded-control px-2 py-2.5")}
                onClick={() => setMenuOpen(false)}
              >
                FAQ
              </a>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
