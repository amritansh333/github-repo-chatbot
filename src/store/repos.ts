"use client";

import { create } from "zustand";
import type { GitHubRepo, RepoFilters } from "@/types/github";

interface ReposState {
  repos: GitHubRepo[];
  loading: boolean;
  error: string | null;
  filters: RepoFilters;
  lastFetched: number | null;
  setRepos: (repos: GitHubRepo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<RepoFilters>) => void;
  clearRepos: () => void;
}

const defaultFilters: RepoFilters = {
  search: "",
  sort: "updated",
  direction: "desc",
  language: "",
  visibility: "all",
};

export const useReposStore = create<ReposState>()((set) => ({
  repos: [],
  loading: false,
  error: null,
  filters: defaultFilters,
  lastFetched: null,
  setRepos: (repos) => set({ repos, lastFetched: Date.now() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearRepos: () =>
    set({ repos: [], error: null, lastFetched: null, filters: defaultFilters }),
}));
