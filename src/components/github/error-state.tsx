import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20 mb-4">
        <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-md leading-relaxed mb-6">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
