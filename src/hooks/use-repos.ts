"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth";
import { useReposStore } from "@/store/repos";
import { fetchUserRepos } from "@/lib/github";
import type { GitHubRepo } from "@/types/github";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type ApiSort = "updated" | "created" | "full_name" | "pushed";

function toApiSort(sort: string): ApiSort {
  if (sort === "name") return "full_name";
  if (sort === "stars" || sort === "forks") return "updated"; // fallback; GitHub API doesn't support stars sort on /user/repos
  if (sort === "created") return "created";
  return "updated";
}

export function useRepos() {
  const { token } = useAuthStore();
  const {
    repos,
    loading,
    error,
    filters,
    lastFetched,
    setRepos,
    setLoading,
    setError,
    setFilters,
  } = useReposStore();

  const fetch = React.useCallback(
    async (force = false) => {
      if (!token) return;
      const stale =
        !lastFetched || Date.now() - lastFetched > CACHE_TTL_MS;
      if (!force && !stale && repos.length > 0) return;

      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserRepos(token, {
          sort: toApiSort(filters.sort),
          direction: filters.direction,
          per_page: 100,
          visibility: filters.visibility,
        });
        setRepos(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch repositories"
        );
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, lastFetched, repos.length, filters.sort, filters.direction, filters.visibility]
  );

  React.useEffect(() => {
    void fetch();
  }, [fetch]);

  const filtered = React.useMemo((): GitHubRepo[] => {
    let result = [...repos];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.topics?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters.language) {
      result = result.filter(
        (r) =>
          r.language?.toLowerCase() === filters.language.toLowerCase()
      );
    }

    if (filters.visibility !== "all") {
      result = result.filter((r) =>
        filters.visibility === "private" ? r.private : !r.private
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (filters.sort) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "stars":
          cmp = a.stargazers_count - b.stargazers_count;
          break;
        case "forks":
          cmp = a.forks_count - b.forks_count;
          break;
        case "created":
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
        case "updated":
        default:
          cmp =
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime();
      }
      return filters.direction === "asc" ? cmp : -cmp;
    });

    return result;
  }, [repos, filters]);

  const languages = React.useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  const stats = React.useMemo(
    () => ({
      total: repos.length,
      public: repos.filter((r) => !r.private).length,
      private: repos.filter((r) => r.private).length,
      forks: repos.filter((r) => r.fork).length,
      totalStars: repos.reduce((s, r) => s + r.stargazers_count, 0),
      topLanguage: (() => {
        const counts: Record<string, number> = {};
        repos.forEach((r) => {
          if (r.language)
            counts[r.language] = (counts[r.language] ?? 0) + 1;
        });
        return (
          Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        );
      })(),
    }),
    [repos]
  );

  const recent = React.useMemo(
    () =>
      [...repos]
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 6),
    [repos]
  );

  return {
    repos: filtered,
    allRepos: repos,
    loading,
    error,
    filters,
    setFilters,
    refetch: () => fetch(true),
    languages,
    stats,
    recent,
  };
}
