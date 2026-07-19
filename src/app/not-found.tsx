import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center space-y-4">
        <p className="text-8xl font-bold text-[var(--muted-foreground)]/30">404</p>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Page not found</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
