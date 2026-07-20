import { Skeleton } from "@/components/ui/skeleton";

export function RepoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-3 w-14" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Topics */}
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-1 border-t border-[var(--border)]">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10 ml-auto" />
      </div>
    </div>
  );
}

export function RepoGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <RepoCardSkeleton key={i} />
      ))}
    </div>
  );
}
