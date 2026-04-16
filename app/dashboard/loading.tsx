import { Logo } from "@/components/ui/Logo";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        <div className="relative">
          <span
            className="absolute -inset-3 animate-pulse rounded-2xl bg-margify-cyan/15 blur-xl"
            aria-hidden
          />
          <Logo size="lg" showWordmark={false} className="relative" />
        </div>
        <p className="text-sm text-margify-muted">Cargando dashboard…</p>
      </div>
      <div className="animate-pulse space-y-6">
        <div className="h-10 max-w-md rounded-control bg-margify-card" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-card bg-margify-card" />
          ))}
        </div>
        <div className="h-80 rounded-card bg-margify-card" />
      </div>
    </div>
  );
}
