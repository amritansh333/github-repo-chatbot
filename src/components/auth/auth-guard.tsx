"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    // After hydration, check auth state
    setChecked(true);
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  if (!checked) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
