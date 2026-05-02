"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { buttonClassName } from "@/components/ui/Button";
import { landingGlassNav } from "@/lib/landing-glass-styles";
import { cn } from "@/lib/utils";

/** Misma jerarquía visual que la referencia: blanco pleno sobre vidrio teal. */
const navLinkClassName =
  "text-sm font-medium text-white transition-colors duration-margify hover:text-white/90";

const shellClassName = cn(
  "mx-auto max-w-6xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.08)] md:rounded-3xl",
  landingGlassNav
);

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
      <div className={shellClassName}>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-x-4 sm:gap-x-6 md:gap-x-8">
            <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
              <Logo priority />
            </Link>

            <nav
              className="hidden min-w-0 flex-1 items-center gap-x-4 sm:flex sm:gap-x-5 md:gap-x-5"
              aria-label="Secciones de la página"
            >
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

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="whitespace-nowrap text-sm font-medium text-white transition-colors duration-margify hover:text-white/90"
            >
              Ingresar
            </Link>
            <Link
              href="/auth/register"
              className={buttonClassName(
                "primary",
                "shrink-0 whitespace-nowrap px-3 py-1.5 text-xs shadow-[0_4px_20px_rgba(100,223,223,0.25)] sm:px-4 sm:py-2 sm:text-sm"
              )}
            >
              Registrarse
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-white/15 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-margify-cyan/45 hover:text-margify-cyan sm:hidden"
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
          <div
            id="landing-mobile-nav"
            className="border-t border-white/10 px-3 pb-3 pt-1 sm:hidden"
          >
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
