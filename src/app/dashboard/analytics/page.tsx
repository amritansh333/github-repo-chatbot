import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Analytics</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Detailed insights will be available in Sprint 2.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Analytics content coming in Sprint 2.</p>
      </div>
    </div>
  );
}
