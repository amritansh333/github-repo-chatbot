import * as React from "react";
import { Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  variant?: "no-repos" | "no-results";
  onClearFilters?: () => void;
}

export function EmptyState({ variant = "no-repos", onClearFilters }: EmptyStateProps) {
  if (variant === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] mb-4">
          <Search className="h-7 w-7 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-1.5">
          No repositories found
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] max-w-xs leading-relaxed mb-6">
          No repositories match your current filters. Try adjusting your search
          or clearing the filters.
        </p>
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] mb-4">
        <BookOpen className="h-7 w-7 text-[var(--muted-foreground)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-1.5">
        No repositories yet
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-xs leading-relaxed">
        You don&apos;t have any repositories accessible with this token. Create
        one on GitHub or check your token permissions.
      </p>
    </div>
  );
}
