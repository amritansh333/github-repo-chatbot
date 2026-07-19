import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Settings</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Manage your application preferences.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Settings coming in Sprint 2.</p>
      </div>
    </div>
  );
}
