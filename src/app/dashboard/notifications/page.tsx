import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Notifications</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          12 unread notifications.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Notifications coming in Sprint 2.</p>
      </div>
    </div>
  );
}
