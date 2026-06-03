import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/server/auth-user";
import { DEMO_COOKIE, isDemoCookieActive } from "@/lib/demo-cookie";
import { loadLiveDashboardData } from "@/lib/integrations/load-live-data";
import { computeInventoryPayload } from "@/lib/inventory/compute";
import { getInventoryStock } from "@/lib/inventory/store";
import { mockOrders } from "@/lib/mock-data";
import { mockStockRows } from "@/lib/inventory/mock-stock";
import type { InventoryPayload } from "@/lib/inventory/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = cookies();
  const demoActive = isDemoCookieActive(cookieStore.get(DEMO_COOKIE)?.value);
  const authUser = await getAuthUser();

  // Demo mode
  if (demoActive && !authUser) {
    const { products, kpis } = computeInventoryPayload(mockOrders, mockStockRows);
    const payload: InventoryPayload = { products, kpis, generatedAt: new Date().toISOString() };
    return NextResponse.json(payload);
  }

  if (!authUser) {
    return NextResponse.json({ status: "error", message: "No autorizado" }, { status: 401 });
  }

  const [live, stockRows] = await Promise.all([
    loadLiveDashboardData(authUser.id),
    getInventoryStock(authUser.id),
  ]);

  // If user has no stock rows, use orders-only analysis
  const { products, kpis } = computeInventoryPayload(live.orders, stockRows);
  const payload: InventoryPayload = { products, kpis, generatedAt: new Date().toISOString() };
  return NextResponse.json(payload);
}
