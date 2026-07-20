"use client";

import * as React from "react";
import { Search, SortAsc, SortDesc, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RepoFilters, SortOption } from "@/types/github";

interface RepoFiltersBarProps {
  filters: RepoFilters;
  languages: string[];
  totalCount: number;
  filteredCount: number;
  onFiltersChange: (filters: Partial<RepoFilters>) => void;
  onRefresh: () => void;
  loading: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Date created" },
  { value: "name", label: "Name" },
  { value: "stars", label: "Stars" },
  { value: "forks", label: "Forks" },
];

export function RepoFiltersBar({
  filters,
  languages,
  totalCount,
  filteredCount,
  onFiltersChange,
  onRefresh,
  loading,
}: RepoFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
          <Input
            placeholder="Search repositories…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9"
            aria-label="Search repositories"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh repositories"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Sort by */}
        <Select
          value={filters.sort}
          onValueChange={(v) => onFiltersChange({ sort: v as SortOption })}
        >
          <SelectTrigger className="h-9 w-44 text-xs" aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Direction toggle */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() =>
            onFiltersChange({
              direction: filters.direction === "asc" ? "desc" : "asc",
            })
          }
          aria-label={filters.direction === "asc" ? "Sort descending" : "Sort ascending"}
          title={filters.direction === "asc" ? "Ascending" : "Descending"}
        >
          {filters.direction === "asc" ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>

        {/* Visibility */}
        <Select
          value={filters.visibility}
          onValueChange={(v) =>
            onFiltersChange({
              visibility: v as RepoFilters["visibility"],
            })
          }
        >
          <SelectTrigger className="h-9 w-32 text-xs" aria-label="Visibility filter">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All repos</SelectItem>
            <SelectItem value="public" className="text-xs">Public</SelectItem>
            <SelectItem value="private" className="text-xs">Private</SelectItem>
          </SelectContent>
        </Select>

        {/* Language */}
        {languages.length > 0 && (
          <Select
            value={filters.language || "__all__"}
            onValueChange={(v) =>
              onFiltersChange({ language: v === "__all__" ? "" : v })
            }
          >
            <SelectTrigger className="h-9 w-36 text-xs" aria-label="Language filter">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" className="text-xs">All languages</SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang} className="text-xs">
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Count */}
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
          {filteredCount === totalCount
            ? `${totalCount} repositories`
            : `${filteredCount} of ${totalCount}`}
        </span>
      </div>
    </div>
  );
}
