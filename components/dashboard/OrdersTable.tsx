"use client";

import { useMemo, useState } from "react";
import type { Order } from "@/types";
import type { Column } from "@/components/ui/Table";
import { DataTable } from "@/components/ui/Table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { marginPercent, orderProfit } from "@/lib/calculations";

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [channel, setChannel] = useState<string>("todos");

  const rows = useMemo(() => {
    let list = [...orders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (channel !== "todos") {
      list = list.filter((o) => o.channel === channel);
    }
    return list.map((o) => {
      const profit = orderProfit({
        revenue: o.revenue,
        product_cost: o.product_cost,
        shipping_cost: o.shipping_cost,
        payment_commission: o.payment_commission,
        ads_spend_attributed: o.ads_spend_attributed,
      });
      const totalCost = o.revenue - profit;
      const margin = marginPercent(profit, o.revenue);
      return {
        id: o.id,
        fecha: o.date,
        producto: o.product_name,
        canal: o.channel,
        venta: o.revenue,
        costo: totalCost,
        ganancia: profit,
        margen: margin,
      };
    });
  }, [channel, orders]);

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "fecha",
      header: "Fecha",
      sortable: true,
      accessor: (r) => r.fecha,
      render: (r) => formatDate(r.fecha, "short"),
    },
    { key: "producto", header: "Producto", sortable: true },
    { key: "canal", header: "Canal", sortable: true },
    {
      key: "venta",
      header: "Venta",
      sortable: true,
      accessor: (r) => r.venta,
      render: (r) => formatCurrency(r.venta),
    },
    {
      key: "costo",
      header: "Costo total",
      sortable: true,
      accessor: (r) => r.costo,
      render: (r) => formatCurrency(r.costo),
    },
    {
      key: "ganancia",
      header: "Ganancia",
      sortable: true,
      accessor: (r) => r.ganancia,
      render: (r) => (
        <span className={r.ganancia >= 0 ? "text-margify-cyan" : "text-margify-negative"}>
          {formatCurrency(r.ganancia)}
        </span>
      ),
    },
    {
      key: "margen",
      header: "Margen %",
      sortable: true,
      accessor: (r) => r.margen,
      render: (r) => `${r.margen.toFixed(1)}%`,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      pageSize={8}
      searchable
      searchKeys={["producto", "canal"]}
      filterSlot={
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text outline-none transition-[border] duration-margify focus:border-margify-cyan"
        >
          <option value="todos">Todos los canales</option>
          <option value="TiendaNube">TiendaNube</option>
          <option value="MercadoLibre">MercadoLibre</option>
          <option value="Shopify">Shopify</option>
        </select>
      }
    />
  );
}
