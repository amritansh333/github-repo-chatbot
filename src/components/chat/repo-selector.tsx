"use client";

import * as React from "react";
import { Search, GitFork, Lock, Globe, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLanguageColor } from "@/lib/language-colors";
import type { GitHubRepo } from "@/types/github";

interface RepoSelectorProps {
  repos: GitHubRepo[];
  selected: GitHubRepo | null;
  onSelect: (repo: GitHubRepo) => void;
  onClear: () => void;
  loading?: boolean;
}

export function RepoSelector({
  repos,
  selected,
  onSelect,
  onClear,
  loading,
}: RepoSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!search) return repos.slice(0, 50);
    const q = search.toLowerCase();
    return repos
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.full_name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [repos, search]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Focus input when open
  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (repo: GitHubRepo) => {
    onSelect(repo);
    setOpen(false);
    setSearch("");
  };

  if (selected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <GitFork className="h-3.5 w-3.5 text-violet-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--foreground)] truncate">
              {selected.full_name}
            </span>
            {selected.language && (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: getLanguageColor(selected.language) }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
              {selected.default_branch}
            </span>
            {selected.private ? (
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                <Lock className="h-2.5 w-2.5" />
                private
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                <Globe className="h-2.5 w-2.5" />
                public
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={onClear}
          aria-label="Clear repository selection"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/30 hover:bg-[var(--muted)]/60 transition-colors text-left",
          open && "border-[var(--ring)]/30"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading}
      >
        <GitFork className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
        <span className="flex-1 text-sm text-[var(--muted-foreground)]">
          {loading ? "Loading repositories…" : "Select a repository to chat with"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--muted-foreground)] transition-transform duration-200 shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-[var(--border)] bg-[var(--popover)] shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories…"
                className="pl-8 h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setOpen(false); setSearch(""); }
                  if (e.key === "Enter" && filtered.length === 1) handleSelect(filtered[0]);
                }}
              />
            </div>
          </div>

          {/* List */}
          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto py-1"
            aria-label="Repositories"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
                No repositories found
              </li>
            ) : (
              filtered.map((repo) => (
                <li key={repo.id} role="option" aria-selected={false}>
                  <button
                    onClick={() => handleSelect(repo)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--accent)] transition-colors text-left"
                  >
                    <GitFork className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)] truncate">
                          {repo.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                        >
                          {repo.private ? "private" : "public"}
                        </Badge>
                      </div>
                      {repo.description && (
                        <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    {repo.language && (
                      <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] shrink-0">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: getLanguageColor(repo.language) }}
                        />
                        {repo.language}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
