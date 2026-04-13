"use client";

import { useMemo, useState } from "react";
import { Megaphone, MousePointerClick, Target, Wallet } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Header } from "@/components/ui/Header";
import { MetricCard } from "@/components/ui/MetricCard";
import { mockCampaigns, mockUser } from "@/lib/mock-data";
import type { Campaign } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function CampanasPage() {
  const { dateRange, setDateRange } = useDashboard();
  const [rows, setRows] = useState<Campaign[]>(() => [...mockCampaigns]);

  const totals = useMemo(() => {
    const spend = rows.reduce((a, c) => a + c.spend, 0);
    const attr = rows.reduce((a, c) => a + c.attributed_revenue, 0);
    const conv = rows.reduce((a, c) => a + (c.conversions ?? 0), 0);
    const roas = spend > 0 ? attr / spend : 0;
    const cpa = conv > 0 ? spend / conv : 0;
    return { spend, roas, cpa, conv };
  }, [rows]);

  function toggleStatus(id: string) {
    setRows((r) =>
      r.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "active" ? "paused" : "active" }
          : c
      )
    );
  }

  const tableData = useMemo(
    () =>
      rows.map((c) => {
        const diff =
          c.roas_platform > 0 ? ((c.roas_real - c.roas_platform) / c.roas_platform) * 100 : 0;
        const conv = c.conversions ?? 1;
        const cpa = c.spend / conv;
        return {
          id: c.id,
          nombre: c.campaign_name,
          gasto: c.spend,
          ventas: c.attributed_revenue,
          roasMeta: c.roas_platform,
          roasReal: c.roas_real,
          diff,
          estado: c.status,
          cpa,
        };
      }),
    [rows]
  );

  const columns: Column<(typeof tableData)[number]>[] = [
    { key: "nombre", header: "Campaña", sortable: true },
    {
      key: "gasto",
      header: "Gasto",
      sortable: true,
      accessor: (r) => r.gasto,
      render: (r) => formatCurrency(r.gasto),
    },
    {
      key: "ventas",
      header: "Ventas atribuidas",
      sortable: true,
      accessor: (r) => r.ventas,
      render: (r) => formatCurrency(r.ventas),
    },
    {
      key: "roasMeta",
      header: "ROAS Meta",
      sortable: true,
      accessor: (r) => r.roasMeta,
      render: (r) => `${r.roasMeta.toFixed(2)}x`,
    },
    {
      key: "roasReal",
      header: "ROAS real",
      sortable: true,
      accessor: (r) => r.roasReal,
      render: (r) => `${r.roasReal.toFixed(2)}x`,
    },
    {
      key: "diff",
      header: "Diferencia %",
      sortable: true,
      accessor: (r) => r.diff,
      render: (r) => `${r.diff > 0 ? "+" : ""}${r.diff.toFixed(1)}%`,
    },
    {
      key: "estado",
      header: "Estado",
      render: (r) => (
        <Badge
          type={r.estado === "active" ? "success" : "neutral"}
          label={r.estado === "active" ? "Activa" : "Pausada"}
        />
      ),
    },
    {
      key: "toggle",
      header: "",
      sortable: false,
      render: (r) => (
        <button
          type="button"
          onClick={() => toggleStatus(r.id)}
          className="rounded-control border border-margify-border px-2 py-1 text-xs text-margify-muted transition-colors duration-margify hover:border-margify-cyan hover:text-margify-cyan"
        >
          {r.estado === "active" ? "Pausar" : "Activar"}
        </button>
      ),
    },
  ];

  return (
    <>
      <Header
        userName={mockUser.full_name}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Gasto total en ads"
          value={totals.spend}
          icon={Wallet}
          change={4.2}
          changeType="negative"
        />
        <MetricCard
          title="ROAS real promedio"
          value={totals.roas}
          valueIsCurrency={false}
          suffix="x"
          icon={Target}
          change={2.1}
          changeType="positive"
        />
        <MetricCard
          title="CPA real"
          value={totals.cpa}
          icon={MousePointerClick}
          change={-3.0}
          changeType="positive"
        />
        <MetricCard
          title="Conversiones"
          value={totals.conv}
          valueIsCurrency={false}
          icon={Megaphone}
          change={6.4}
          changeType="positive"
        />
      </div>

      <Card className="mt-8 border-margify-cyan/25 bg-margify-cyan/5">
        <CardTitle className="text-margify-cyan">Importante</CardTitle>
        <CardDescription className="text-margify-text/90">
          Meta pierde entre 30% y 50% de tus conversiones desde iOS 14. El ROAS real de Margify
          incluye todas las ventas verificadas contra tu backoffice y medios de pago.
        </CardDescription>
      </Card>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Campañas de Meta Ads</h2>
        <DataTable
          columns={columns}
          data={tableData}
          pageSize={6}
          rowClassName={(r) =>
            cn(
              r.roasReal >= 2 && "bg-margify-cyan/5",
              r.roasReal >= 1 && r.roasReal < 2 && "bg-amber-500/5",
              r.roasReal < 1 && "bg-margify-negative/5"
            )
          }
        />
      </div>
    </>
  );
}
