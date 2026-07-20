import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { AuthGuard } from "@/components/auth/auth-guard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
