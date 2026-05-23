"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useDemoMode } from "@/components/dashboard/DemoModeContext";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { DODO_CHECKOUT_PRODUCT_KEY } from "@/lib/dodo-checkout";

/**
 * Tras volver de Dodo (`?checkout=success`): activa trial en metadata y refresca el dashboard.
 */
export function CheckoutReturnHandler() {
  const isDemo = useDemoMode();
  const { refreshBootstrap } = useDashboard();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (isDemo || handled.current) return;
    if (searchParams.get("checkout") !== "success") return;
    handled.current = true;

    let productId: string | null = null;
    try {
      productId = sessionStorage.getItem(DODO_CHECKOUT_PRODUCT_KEY);
      sessionStorage.removeItem(DODO_CHECKOUT_PRODUCT_KEY);
    } catch {
      productId = null;
    }

    const cleanUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };

    const run = async () => {
      if (productId) {
        try {
          await fetch("/api/billing/activate-return", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: productId }),
          });
        } catch {
          /* webhook puede llegar después */
        }
      }
      await refreshBootstrap();
      cleanUrl();
    };

    void run();
  }, [isDemo, searchParams, refreshBootstrap]);

  return null;
}
