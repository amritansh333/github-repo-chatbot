"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, BookOpen, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRepos } from "@/hooks/use-repos";
import { StatsCards } from "@/components/github/stats-cards";
import { RepoCard } from "@/components/github/repo-card";
import { RepoCardSkeleton } from "@/components/github/repo-card-skeleton";
import { ErrorState } from "@/components/github/error-state";
import { EmptyState } from "@/components/github/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { stats, recent, loading, error, refetch, allRepos } = useRepos();

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          {user ? (
            <>
              <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                {greeting}, {user.name ?? user.email}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Here&apos;s an overview of your GitHub repositories.
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-8 w-56 mb-2" />
              <Skeleton className="h-4 w-72" />
            </>
          )}
        </div>
        {!loading && allRepos.length > 0 && (
          <p className="text-xs text-[var(--muted-foreground)] shrink-0">
            {allRepos.length} repositories total
          </p>
        )}
      </div>

      <section aria-label="Repository statistics">
        <StatsCards stats={stats} loading={loading && allRepos.length === 0} />
      </section>

      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!error && (
        <section aria-label="Recent repositories">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">Recently updated</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Your 6 most recently active repositories</p>
            </div>
            <div className="flex items-center gap-2">
              {!loading && allRepos.length > 0 && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refetch} aria-label="Refresh">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
              {allRepos.length > 0 && (
                <Button asChild variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <Link href="/dashboard/repositories">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {loading && allRepos.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <RepoCardSkeleton key={i} />)}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState variant="no-repos" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {recent.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
            </div>
          )}
        </section>
      )}

      {!loading && !error && allRepos.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">All repositories</h3>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {allRepos.slice(0, 8).map((repo) => (
              <li key={repo.id}>
                <Link
                  href={`/dashboard/repositories/${repo.owner.login}/${repo.name}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--muted)]/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {repo.full_name}
                    </span>
                    {repo.language && (
                      <span className="hidden sm:block text-xs text-[var(--muted-foreground)] shrink-0">{repo.language}</span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0 ml-4">
                    {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {allRepos.length > 8 && (
            <div className="px-5 py-3 border-t border-[var(--border)]">
              <Link href="/dashboard/repositories" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1">
                View all {allRepos.length} repositories <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
