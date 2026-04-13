export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 rounded-control bg-margify-card" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-card bg-margify-card" />
        ))}
      </div>
      <div className="h-80 rounded-card bg-margify-card" />
    </div>
  );
}
