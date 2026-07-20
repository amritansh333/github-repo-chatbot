import * as React from "react";
import { BookOpen, Lock, Globe, GitFork, Star, Code2 } from "lucide-react";
import { formatNumber } from "@/lib/language-colors";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  stats: {
    total: number;
    public: number;
    private: number;
    forks: number;
    totalStars: number;
    topLanguage: string | null;
  };
  loading: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col gap-3 transition-all duration-200 hover:border-[var(--ring)]/20 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          {label}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent ? `${accent}18` : undefined }}
          aria-hidden
        >
          <span style={{ color: accent ?? "var(--muted-foreground)" }}>
            {icon}
          </span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        icon={<BookOpen className="h-4 w-4" />}
        label="Total"
        value={formatNumber(stats.total)}
        sub="repositories"
        accent="#6366f1"
      />
      <StatCard
        icon={<Globe className="h-4 w-4" />}
        label="Public"
        value={formatNumber(stats.public)}
        sub="visible to everyone"
        accent="#22c55e"
      />
      <StatCard
        icon={<Lock className="h-4 w-4" />}
        label="Private"
        value={formatNumber(stats.private)}
        sub="visible to you"
        accent="#f59e0b"
      />
      <StatCard
        icon={<GitFork className="h-4 w-4" />}
        label="Forks"
        value={formatNumber(stats.forks)}
        sub="forked repos"
        accent="#0ea5e9"
      />
      <StatCard
        icon={<Star className="h-4 w-4" />}
        label="Total Stars"
        value={formatNumber(stats.totalStars)}
        sub="across all repos"
        accent="#f59e0b"
      />
      <StatCard
        icon={<Code2 className="h-4 w-4" />}
        label="Top Language"
        value={stats.topLanguage ?? "—"}
        sub="most used"
        accent="#8b5cf6"
      />
    </div>
  );
}
