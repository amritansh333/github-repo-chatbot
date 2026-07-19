import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Reports</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          3 reports pending review.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Reports content coming in Sprint 2.</p>
      </div>
    </div>
  );
}
