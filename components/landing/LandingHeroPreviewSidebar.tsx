"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Box,
  Home,
  Megaphone,
  Settings,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { DEMO_USER_LABEL } from "@/lib/demo-user";

const previewNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/rentabilidad", label: "Rentabilidad", icon: BarChart3 },
  { href: "/dashboard/campanas", label: "Campañas", icon: Megaphone },
  { href: "/dashboard/productos", label: "Productos", icon: Box },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/dashboard/cashflow", label: "Cashflow", icon: Wallet },
  { href: "/dashboard/alertas", label: "Alertas", icon: Bell },
  { href: "/dashboard/margify-ai", label: "Margify AI", icon: Sparkles },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
] as const;

export function LandingHeroPreviewSidebar({
  alertCount,
  activeHref,
}: {
  alertCount: number;
  activeHref: string;
}) {
  const router = useRouter();

  return (
    <aside
      className="flex w-60 min-w-[240px] shrink-0 flex-col border-r border-margify-border bg-margify-black"
      aria-label="Navegación del panel (vista previa)"
    >
      <div className="flex min-h-[52px] items-center border-b border-margify-border px-5 py-4">
        <Logo size="sm" align="start" />
      </div>
      <div className="flex items-center gap-3 border-b border-margify-border px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-margify-cardAlt text-sm font-semibold text-margify-cyan">
          {DEMO_USER_LABEL.full_name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{DEMO_USER_LABEL.full_name}</p>
          <p className="truncate text-xs text-margify-muted">{DEMO_USER_LABEL.email}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {previewNav.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "relative z-10 group flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200 ease-out motion-safe:hover:brightness-110 motion-safe:active:scale-[0.97] touch-manipulation",
                "focus-visible:ring-2 focus-visible:ring-margify-cyan/45 focus-visible:ring-offset-2 focus-visible:ring-offset-margify-black",
                active
                  ? "border-l-2 border-margify-cyan bg-margify-cyan/15 text-margify-cyan motion-safe:hover:bg-margify-cyan/25"
                  : "border-l-2 border-transparent text-margify-muted motion-safe:hover:translate-x-0.5 motion-safe:hover:bg-margify-cyan/10 motion-safe:hover:text-margify-text motion-safe:hover:shadow-[inset_0_0_0_1px_rgba(100,223,223,0.2)]"
              )}
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                router.push(item.href);
              }}
            >
              <span className="relative transition-transform duration-200 ease-out group-hover:scale-110 motion-safe:group-active:scale-95">
                <Icon className="h-5 w-5 shrink-0" />
                {item.href === "/dashboard/alertas" && alertCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-margify-negative px-1 text-[10px] font-bold text-white">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-margify-border p-4">
        <Link
          href="/auth/register"
          className="flex w-full items-center justify-center rounded-control border border-margify-cyan/40 px-3 py-2.5 text-center text-sm font-medium text-margify-cyan outline-none transition-all duration-200 ease-out motion-safe:hover:scale-[1.02] motion-safe:hover:border-margify-cyan motion-safe:hover:bg-margify-cyan/15 motion-safe:hover:shadow-[0_0_24px_rgba(100,223,223,0.22)] motion-safe:active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-margify-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-margify-black touch-manipulation"
        >
          Empezar gratis
        </Link>
      </div>
    </aside>
  );
}
