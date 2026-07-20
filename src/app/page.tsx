"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { TokenLoginForm } from "@/components/auth/token-login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { GitBranch, Zap, Search, MessageSquare } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  {
    icon: Search,
    title: "Explore repositories",
    description: "Search, filter, and sort across all your GitHub repositories instantly.",
    color: "#6366f1",
  },
  {
    icon: GitBranch,
    title: "Branch & commit history",
    description: "Dive deep into any repository — branches, commits, languages, and more.",
    color: "#0ea5e9",
  },
  {
    icon: MessageSquare,
    title: "Chat with your code",
    description: "Ask questions about any repository in natural language. Coming in Sprint 3.",
    color: "#8b5cf6",
  },
  {
    icon: Zap,
    title: "Blazing fast",
    description: "Built on Next.js 16 with Turbopack for instant navigation.",
    color: "#f59e0b",
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 shadow-sm">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[var(--foreground)]">
              {APP_NAME}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — two column */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                Sprint 2 · Repository management
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--foreground)] mb-5 leading-[1.1]">
                Chat with any{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
                  GitHub
                </span>{" "}
                repository
              </h1>
              <p className="text-base text-[var(--muted-foreground)] leading-relaxed mb-6 max-w-lg">
                Connect your GitHub account, explore all your repositories, and
                get ready for AI-powered code conversations.
              </p>

              {/* Features list */}
              <ul className="space-y-3 mb-8">
                {["Browse all your GitHub repositories", "Search, filter and sort by any criteria", "View branches, commits, and language breakdown"].map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5 text-sm text-[var(--muted-foreground)]">
                    <span className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 12 12" className="h-3 w-3 text-green-600 dark:text-green-400">
                        <path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: login form */}
            <div>
              <TokenLoginForm />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg mb-4"
                      style={{ backgroundColor: `${f.color}18` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: f.color }} />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1.5">
                      {f.title}
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Built with Next.js 16
          </p>
        </div>
      </footer>
    </div>
  );
}
