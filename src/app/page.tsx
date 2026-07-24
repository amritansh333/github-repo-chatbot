import Link from "next/link";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { GitBranch, Zap, Search, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
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
    description: "Ask questions about any repository in natural language with Gemini AI.",
    color: "#8b5cf6",
  },
  {
    icon: Zap,
    title: "Blazing fast",
    description: "Built on Next.js 16 with Turbopack for instant navigation.",
    color: "#f59e0b",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
            Sprint 5 · SaaS with Auth & Database
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--foreground)] mb-6 leading-[1.1]">
            Chat with any{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
              GitHub
            </span>{" "}
            repository
          </h1>
          <p className="max-w-xl mx-auto text-base text-[var(--muted-foreground)] leading-relaxed mb-10">
            Sign in with GitHub or Google. RepoChat uses Gemini AI to help you
            understand any codebase through natural conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/signin">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

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
            Built with Next.js 16 · Gemini 2.5 Flash
          </p>
        </div>
      </footer>
    </div>
  );
}
