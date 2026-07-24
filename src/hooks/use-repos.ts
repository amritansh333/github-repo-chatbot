"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useReposStore } from "@/store/repos";
import { fetchUserRepos } from "@/lib/github";
import type { GitHubRepo } from "@/types/github";
import type { ApiSortOption } from "@/lib/github";

const CACHE_TTL_MS = 5 * 60 * 1000;

function toApiSort(sort: string): ApiSortOption {
  if (sort === "name") return "full_name";
  if (sort === "created") return "created";
  return "updated";
}

// Fetch the decrypted GitHub token from the server
async function fetchGitHubToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/github-token");
    if (!res.ok) return null;
    // The GET endpoint returns { hasToken, masked } — we need the real token
    // for API calls. We fetch it via a dedicated endpoint.
    const data = await res.json() as { hasToken: boolean };
    return data.hasToken ? "__use_server__" : null;
  } catch {
    return null;
  }
}

export function useRepos() {
  const { status } = useSession();
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

  // We store the resolved token in a ref to avoid re-renders
  const tokenRef = React.useRef<string | null>(null);
  const [hasToken, setHasToken] = React.useState<boolean | null>(null);

  // Resolve GitHub token from the server once
  React.useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      try {
        const res = await fetch("/api/github-token/raw");
        if (!res.ok) {
          setHasToken(false);
          return;
        }
        const data = await res.json() as { token?: string };
        if (data.token) {
          tokenRef.current = data.token;
          setHasToken(true);
        } else {
          setHasToken(false);
        }
      } catch {
        setHasToken(false);
      }
    })();
  }, [status]);

  const fetchRepos = React.useCallback(
    async (force = false) => {
      if (!tokenRef.current) return;
      const stale = !lastFetched || Date.now() - lastFetched > CACHE_TTL_MS;
      if (!force && !stale && repos.length > 0) return;

      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserRepos(tokenRef.current, {
          sort: toApiSort(filters.sort),
          direction: filters.direction,
          per_page: 100,
          visibility: filters.visibility,
        });
        setRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch repositories");
      } finally {
        setLoading(false);
      }
    },
    [lastFetched, repos.length, filters.sort, filters.direction, filters.visibility, setRepos, setLoading, setError]
  );

  React.useEffect(() => {
    if (hasToken) void fetchRepos();
  }, [hasToken, fetchRepos]);

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
        (r) => r.language?.toLowerCase() === filters.language.toLowerCase()
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
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "stars": cmp = a.stargazers_count - b.stargazers_count; break;
        case "forks": cmp = a.forks_count - b.forks_count; break;
        case "created": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        default: cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }
      return filters.direction === "asc" ? cmp : -cmp;
    });

    return result;
  }, [repos, filters]);

  const languages = React.useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => { if (r.language) langs.add(r.language); });
    return Array.from(langs).sort();
  }, [repos]);

  const stats = React.useMemo(() => ({
    total: repos.length,
    public: repos.filter((r) => !r.private).length,
    private: repos.filter((r) => r.private).length,
    forks: repos.filter((r) => r.fork).length,
    totalStars: repos.reduce((s, r) => s + r.stargazers_count, 0),
    topLanguage: (() => {
      const counts: Record<string, number> = {};
      repos.forEach((r) => { if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    })(),
  }), [repos]);

  const recent = React.useMemo(
    () => [...repos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6),
    [repos]
  );

  return {
    repos: filtered,
    allRepos: repos,
    loading,
    error,
    filters,
    setFilters,
    refetch: () => fetchRepos(true),
    languages,
    stats,
    recent,
    hasToken,
    getToken: () => tokenRef.current,
  };
}
