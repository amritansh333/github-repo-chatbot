"use client";

import * as React from "react";
import { useRepos } from "@/hooks/use-repos";
import { RepoCard } from "@/components/github/repo-card";
import { RepoGridSkeleton } from "@/components/github/repo-card-skeleton";
import { RepoFiltersBar } from "@/components/github/repo-filters-bar";
import { ErrorState } from "@/components/github/error-state";
import { EmptyState } from "@/components/github/empty-state";

export default function RepositoriesPage() {
  const {
    repos,
    allRepos,
    loading,
    error,
    filters,
    setFilters,
    refetch,
    languages,
  } = useRepos();

  const hasActiveFilters =
    !!filters.search ||
    !!filters.language ||
    filters.visibility !== "all";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Repositories
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Browse and search all your GitHub repositories.
        </p>
      </div>

      {/* Filters */}
      <RepoFiltersBar
        filters={filters}
        languages={languages}
        totalCount={allRepos.length}
        filteredCount={repos.length}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        loading={loading}
      />

      {/* Content */}
      {loading && allRepos.length === 0 ? (
        <RepoGridSkeleton count={12} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : repos.length === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? "no-results" : "no-repos"}
          onClearFilters={
            hasActiveFilters
              ? () =>
                  setFilters({
                    search: "",
                    language: "",
                    visibility: "all",
                  })
              : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
          {loading && allRepos.length > 0 && (
            <p className="text-center text-xs text-[var(--muted-foreground)] py-4 animate-pulse">
              Refreshing…
            </p>
          )}
        </>
      )}
    </div>
  );
}
