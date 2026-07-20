import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Star,
  GitFork,
  CircleDot,
  Lock,
  Globe,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getLanguageColor, formatNumber } from "@/lib/language-colors";
import type { GitHubRepo } from "@/types/github";

interface RepoCardProps {
  repo: GitHubRepo;
  className?: string;
}

export function RepoCard({ repo, className }: RepoCardProps) {
  const updatedAt = formatDistanceToNow(new Date(repo.updated_at), {
    addSuffix: true,
  });

  return (
    <Link
      href={`/dashboard/repositories/${repo.owner.login}/${repo.name}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all duration-200 hover:border-[var(--ring)]/30 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className
      )}
      aria-label={`View repository ${repo.full_name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--muted)]">
            <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
              {repo.name}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] truncate">
              {repo.owner.login}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {repo.private ? (
            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Lock className="h-3 w-3" />
              Private
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Globe className="h-3 w-3" />
              Public
            </span>
          )}
          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {repo.description ?? (
          <span className="italic opacity-60">No description provided.</span>
        )}
      </p>

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 4).map((topic) => (
            <Badge
              key={topic}
              variant="secondary"
              className="text-[10px] px-2 py-0.5 font-medium"
            >
              {topic}
            </Badge>
          ))}
          {repo.topics.length > 4 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 font-medium"
            >
              +{repo.topics.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 pt-1 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] mt-auto">
        {/* Language */}
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getLanguageColor(repo.language) }}
              aria-hidden
            />
            {repo.language}
          </span>
        )}

        {/* Stars */}
        {repo.stargazers_count > 0 && (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {formatNumber(repo.stargazers_count)}
          </span>
        )}

        {/* Forks */}
        {repo.forks_count > 0 && (
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {formatNumber(repo.forks_count)}
          </span>
        )}

        {/* Issues */}
        {repo.open_issues_count > 0 && (
          <span className="flex items-center gap-1">
            <CircleDot className="h-3 w-3" />
            {formatNumber(repo.open_issues_count)}
          </span>
        )}

        {/* Updated */}
        <span className="ml-auto">{updatedAt}</span>
      </div>
    </Link>
  );
}
