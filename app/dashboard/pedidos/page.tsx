"use client";

import { ShopifyOrdersTable } from "@/components/dashboard/ShopifyOrdersTable";
import { useDashboardIdentity } from "@/components/dashboard/DemoModeContext";
import { Header } from "@/components/ui/Header";

export default function PedidosPage() {
  const { full_name } = useDashboardIdentity();

  return (
    <>
      <Header userName={full_name} showDateRange={false} />

      <h1 className="mb-6 text-2xl font-bold text-white">Pedidos</h1>
      <p className="mb-8 text-sm text-margify-muted">
        Últimos 30 días de pedidos de tu tienda de Shopify. Revenue, AOV y
        cantidad de órdenes actualizados al sincronizar.
      </p>

      <ShopifyOrdersTable />
    </>
  );
}
