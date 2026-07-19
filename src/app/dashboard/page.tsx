import type { Metadata } from "next";
import { Users, BarChart3, FileText, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

const STATS = [
  {
    label: "Total Users",
    value: "12,340",
    change: "+8.2%",
    positive: true,
    icon: Users,
  },
  {
    label: "Revenue",
    value: "$84,200",
    change: "+14.5%",
    positive: true,
    icon: TrendingUp,
  },
  {
    label: "Active Reports",
    value: "38",
    change: "-2.1%",
    positive: false,
    icon: FileText,
  },
  {
    label: "Conversion",
    value: "3.6%",
    change: "+0.4%",
    positive: true,
    icon: BarChart3,
  },
];

const RECENT = [
  { name: "Alice Johnson", action: "Signed up", time: "2 min ago" },
  { name: "Bob Martinez", action: "Upgraded plan", time: "11 min ago" },
  { name: "Chloe Park", action: "Submitted report", time: "34 min ago" },
  { name: "David Kim", action: "Signed up", time: "1 hr ago" },
  { name: "Eva Nguyen", action: "Requested export", time: "2 hr ago" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Overview</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                  {stat.label}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--muted)]">
                  <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</p>
                <p
                  className={`text-xs mt-1 font-medium ${
                    stat.positive ? "text-green-600 dark:text-green-400" : "text-red-500"
                  }`}
                >
                  {stat.change} vs last month
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent Activity</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Latest events from your team</p>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {RECENT.map((item, i) => (
            <li key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-medium text-[var(--muted-foreground)]">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{item.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{item.action}</p>
                </div>
              </div>
              <span className="text-xs text-[var(--muted-foreground)] shrink-0">{item.time}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Placeholder chart area */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Analytics Chart</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-6">
          Charts will be wired up in Sprint 2.
        </p>
        <div className="h-48 flex items-end gap-2">
          {[40, 65, 50, 80, 60, 90, 75, 85, 70, 95, 80, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-[var(--muted)] hover:bg-[var(--primary)] transition-colors"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
            <span key={m} className="text-[10px] text-[var(--muted-foreground)]">{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
