import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { Sidebar } from "@/components/ui/Sidebar";
import { mockAlertsHistory, mockUser } from "@/lib/mock-data";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const alertCount = mockAlertsHistory.filter((a) => !a.read).length;

  return (
    <DashboardProvider>
      <div className="flex min-h-screen bg-margify-bg">
        <Sidebar
          userName={mockUser.full_name}
          userEmail={mockUser.email}
          alertCount={alertCount}
        />
        <main className="min-h-screen flex-1 px-4 pb-12 pt-[4.5rem] md:px-8 md:pt-8">
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
