"use client";

import * as React from "react";
import Link from "next/link";
import { use } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Star,
  GitFork,
  Eye,
  CircleDot,
  Lock,
  Globe,
  ExternalLink,
  GitBranch,
  GitCommit,
  Code2,
  BookOpen,
  Calendar,
  Scale,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";
import {
  fetchRepo,
  fetchRepoLanguages,
  fetchRepoCommits,
  fetchRepoBranches,
  GitHubApiError,
} from "@/lib/github";
import {
  getLanguageColor,
  formatNumber,
  formatBytes,
} from "@/lib/language-colors";
import type {
  GitHubRepoDetails,
  GitHubLanguages,
  GitHubCommit,
  GitHubBranch,
} from "@/types/github";

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <span className="text-[var(--muted-foreground)]">{icon}</span>
      <div>
        <p className="text-lg font-bold text-[var(--foreground)] leading-none">
          {value}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function LanguageBar({ languages }: { languages: GitHubLanguages }) {
  const total = Object.values(languages).reduce((s, n) => s + n, 0);
  if (total === 0) return null;
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div
        className="flex h-2.5 w-full rounded-full overflow-hidden gap-px"
        aria-label="Language breakdown"
      >
        {sorted.map(([lang, bytes]) => (
          <div
            key={lang}
            title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`}
            style={{
              width: `${(bytes / total) * 100}%`,
              backgroundColor: getLanguageColor(lang),
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {sorted.slice(0, 8).map(([lang, bytes]) => (
          <li key={lang} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getLanguageColor(lang) }}
            />
            <span className="font-medium text-[var(--foreground)]">{lang}</span>
            <span className="text-[var(--muted-foreground)]">
              {((bytes / total) * 100).toFixed(1)}%
            </span>
            <span className="text-[var(--muted-foreground)] hidden sm:inline">
              · {formatBytes(bytes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RepoDetailPage({ params }: PageProps) {
  const { owner, repo: repoName } = use(params);
  const { token } = useAuthStore();

  const [repo, setRepo] = React.useState<GitHubRepoDetails | null>(null);
  const [languages, setLanguages] = React.useState<GitHubLanguages | null>(null);
  const [commits, setCommits] = React.useState<GitHubCommit[] | null>(null);
  const [branches, setBranches] = React.useState<GitHubBranch[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [repoData, langsData, commitsData, branchesData] =
          await Promise.all([
            fetchRepo(token!, owner, repoName),
            fetchRepoLanguages(token!, owner, repoName),
            fetchRepoCommits(token!, owner, repoName, 20),
            fetchRepoBranches(token!, owner, repoName),
          ]);
        if (!cancelled) {
          setRepo(repoData);
          setLanguages(langsData);
          setCommits(commitsData);
          setBranches(branchesData);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof GitHubApiError && err.status === 404) {
            setError("Repository not found or you don't have access.");
          } else {
            setError(
              err instanceof Error ? err.message : "Failed to load repository."
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [token, owner, repoName]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20 mb-4">
          <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-1.5">
          Could not load repository
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] max-w-md leading-relaxed mb-6">
          {error}
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/repositories">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to repositories
          </Link>
        </Button>
      </div>
    );
  }

  if (!repo) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Link
          href="/dashboard/repositories"
          className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Repositories
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)] font-medium">{owner}</span>
        <span>/</span>
        <span className="text-[var(--foreground)] font-semibold">{repoName}</span>
      </div>

      {/* Repo header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-[var(--border)]">
            <BookOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                {repo.name}
              </h1>
              <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] border border-[var(--border)] rounded-full px-2 py-0.5">
                {repo.private ? (
                  <>
                    <Lock className="h-3 w-3" />
                    Private
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" />
                    Public
                  </>
                )}
              </span>
              {repo.archived && (
                <Badge variant="secondary" className="text-xs">
                  Archived
                </Badge>
              )}
              {repo.fork && (
                <Badge variant="secondary" className="text-xs">
                  Fork
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {repo.owner.login}/{repo.name}
            </p>
            {repo.description && (
              <p className="text-sm text-[var(--foreground)] mt-2 leading-relaxed max-w-2xl">
                {repo.description}
              </p>
            )}
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                {repo.homepage}
              </a>
            )}
            {repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {repo.topics.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Stats pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatPill
            icon={<Star className="h-4 w-4" />}
            label="Stars"
            value={formatNumber(repo.stargazers_count)}
          />
          <StatPill
            icon={<GitFork className="h-4 w-4" />}
            label="Forks"
            value={formatNumber(repo.forks_count)}
          />
          <StatPill
            icon={<Eye className="h-4 w-4" />}
            label="Watchers"
            value={formatNumber(repo.watchers_count)}
          />
          <StatPill
            icon={<CircleDot className="h-4 w-4" />}
            label="Open issues"
            value={formatNumber(repo.open_issues_count)}
          />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 pt-5 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getLanguageColor(repo.language) }}
              />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5" />
            {formatBytes(repo.size * 1024)}
          </span>
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            {repo.default_branch}
          </span>
          {repo.license && (
            <span className="flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              {repo.license.name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Created {format(new Date(repo.created_at), "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            Updated{" "}
            {formatDistanceToNow(new Date(repo.updated_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="languages">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="languages" className="gap-1.5">
            <Code2 className="h-3.5 w-3.5" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="commits" className="gap-1.5">
            <GitCommit className="h-3.5 w-3.5" />
            Commits
            {commits && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">
                {commits.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Branches
            {branches && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">
                {branches.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Languages tab */}
        <TabsContent value="languages">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Language breakdown
            </h3>
            {languages && Object.keys(languages).length > 0 ? (
              <LanguageBar languages={languages} />
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                No language data available.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Commits tab */}
        <TabsContent value="commits">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Recent commits
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Last {commits?.length ?? 0} commits on{" "}
                <code className="font-mono text-xs bg-[var(--muted)] px-1 py-0.5 rounded">
                  {repo.default_branch}
                </code>
              </p>
            </div>
            {commits === null ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : commits.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] px-5 py-8 text-center">
                No commits found.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {commits.map((commit) => (
                  <li key={commit.sha} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {commit.author ? (
                        <img
                          src={commit.author.avatar_url}
                          alt={commit.author.login}
                          className="h-7 w-7 rounded-full shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-[var(--muted)] flex items-center justify-center shrink-0 mt-0.5">
                          <GitCommit className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[var(--foreground)] hover:text-violet-600 dark:hover:text-violet-400 transition-colors line-clamp-2"
                        >
                          {commit.commit.message.split("\n")[0]}
                        </a>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {commit.author?.login ?? commit.commit.author.name}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">·</span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatDistanceToNow(
                              new Date(commit.commit.author.date),
                              { addSuffix: true }
                            )}
                          </span>
                          <code className="ml-auto font-mono text-[10px] text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded hidden sm:inline">
                            {commit.sha.slice(0, 7)}
                          </code>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        {/* Branches tab */}
        <TabsContent value="branches">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Branches
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {branches?.length ?? 0} branches in this repository
              </p>
            </div>
            {branches === null ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : branches.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] px-5 py-8 text-center">
                No branches found.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {branches.map((branch) => (
                  <li
                    key={branch.name}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <GitBranch className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                      <span className="text-sm font-mono text-[var(--foreground)]">
                        {branch.name}
                      </span>
                      {branch.name === repo.default_branch && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          default
                        </Badge>
                      )}
                      {branch.protected && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          protected
                        </Badge>
                      )}
                    </div>
                    <code className="font-mono text-[10px] text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded hidden sm:inline">
                      {branch.commit.sha.slice(0, 7)}
                    </code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
