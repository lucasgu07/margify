"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Box,
  Wallet,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/rentabilidad", label: "Rentabilidad", icon: BarChart3 },
  { href: "/dashboard/campanas", label: "Campañas", icon: Megaphone },
  { href: "/dashboard/productos", label: "Productos", icon: Box },
  { href: "/dashboard/cashflow", label: "Cashflow", icon: Wallet },
  { href: "/dashboard/alertas", label: "Alertas", icon: Bell },
  { href: "/dashboard/margify-ai", label: "Margify AI", icon: Sparkles },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar({
  userName,
  userEmail,
  alertCount = 0,
}: {
  userName: string;
  userEmail: string;
  alertCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isDemo = useDemoMode();
  const navItems = useMemo(
    () =>
      isDemo ? nav.filter((item) => item.href !== "/dashboard/margify-ai") : nav,
    [isDemo]
  );

  async function handleLogout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  const inner = (
    <>
      <div className="flex items-center justify-between border-b border-margify-border px-5 py-5">
        <Link href="/dashboard" onClick={() => setOpen(false)} className="min-w-0">
          <Logo className="max-w-full" align="start" />
        </Link>
        <button
          type="button"
          className="rounded-control p-2 text-margify-muted transition-colors duration-margify hover:bg-margify-cyan/15 hover:text-margify-cyan md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-3 border-b border-margify-border px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-margify-cardAlt text-sm font-semibold text-margify-cyan">
          {userName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <p className="truncate text-xs text-margify-muted">{userEmail}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-all duration-margify",
                active
                  ? "border-l-2 border-margify-cyan bg-margify-cyan/15 text-margify-cyan"
                  : "border-l-2 border-transparent text-margify-muted hover:bg-margify-cyan/10 hover:text-margify-text"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
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
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-control border border-margify-border px-3 py-2.5 text-sm font-medium text-margify-muted transition-all duration-margify hover:border-margify-negative/50 hover:text-margify-negative"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed left-0 top-0 z-40 flex h-14 w-full items-center justify-between border-b border-margify-border bg-margify-black px-4 md:hidden">
        <Link href="/dashboard" className="min-w-0 shrink-0">
          <Logo size="sm" />
        </Link>
        <button
          type="button"
          className="rounded-control p-2 text-margify-muted hover:bg-margify-cyan/15 hover:text-margify-cyan"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100%,280px)] max-w-[280px] -translate-x-full flex-col border-r border-margify-border bg-margify-black transition-transform duration-margify md:z-30 md:h-screen md:w-60 md:max-w-none md:translate-x-0",
          open && "translate-x-0"
        )}
      >
        {inner}
      </aside>
      {open ? (
        <button
          type="button"
          aria-label="Cerrar overlay"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
