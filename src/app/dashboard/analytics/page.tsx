"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { useRepos } from "@/hooks/use-repos";
import { StatsCards } from "@/components/github/stats-cards";
import { getLanguageColor } from "@/lib/language-colors";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const { stats, loading, allRepos } = useRepos();

  // Language usage stats
  const languageStats = React.useMemo(() => {
    const counts: Record<string, { repos: number; bytes: number }> = {};
    allRepos.forEach((r) => {
      if (r.language) {
        if (!counts[r.language]) counts[r.language] = { repos: 0, bytes: 0 };
        counts[r.language].repos += 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].repos - a[1].repos)
      .slice(0, 10);
  }, [allRepos]);

  const maxRepos = languageStats[0]?.[1].repos ?? 1;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Analytics
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Insights across all your repositories.
        </p>
      </div>

      <StatsCards stats={stats} loading={loading && allRepos.length === 0} />

      {/* Language breakdown */}
      {languageStats.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Language distribution
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {languageStats.map(([lang, data]) => (
              <div key={lang} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-[var(--foreground)] font-medium truncate">
                  {lang}
                </span>
                <div className="flex-1 bg-[var(--muted)] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(data.repos / maxRepos) * 100}%`,
                      backgroundColor: getLanguageColor(lang),
                    }}
                  />
                </div>
                <span className="w-20 text-right text-xs text-[var(--muted-foreground)] shrink-0">
                  {data.repos} repo{data.repos !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="text-center py-4">
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          More detailed analytics coming in future sprints.
        </p>
        <Button asChild variant="outline" className="gap-1.5">
          <Link href="/dashboard/repositories">
            Browse repositories
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
