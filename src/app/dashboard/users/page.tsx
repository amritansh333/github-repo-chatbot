import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Users</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          User management will be available in Sprint 2.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">User list coming in Sprint 2.</p>
      </div>
    </div>
  );
}
