import Link from "next/link";
import { ArrowRight, LayoutGrid, BarChart3, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Intuitive Dashboard",
    description:
      "A clean, focused workspace that puts your most important data front and center.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Track performance metrics as they happen with live charts and instant insights.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Built with security best practices so your data stays exactly where it should.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description:
      "Next.js 16 with Turbopack means near-instant navigation and zero layout shift.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)]">
              <LayoutGrid className="h-4 w-4 text-[var(--primary-foreground)]" />
            </div>
            <span className="font-semibold text-sm">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-36 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Sprint 1 · Foundation complete
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--foreground)] mb-6 leading-[1.1]">
            Build faster.
            <br />
            Ship with confidence.
          </h1>
          <p className="max-w-xl mx-auto text-[var(--muted-foreground)] text-lg mb-10 leading-relaxed">
            A production-ready Next.js 16 foundation with App Router, TypeScript,
            Tailwind CSS v4, shadcn/ui, and dark mode — ready for Sprint 2.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
            <h2 className="text-2xl font-semibold text-center mb-12 text-[var(--foreground)]">
              Everything you need to start
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--muted)]">
                      <Icon className="h-5 w-5 text-[var(--foreground)]" />
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--foreground)]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tech stack strip */}
        <section className="border-t border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest font-medium mb-6">
              Tech Stack
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Next.js 16",
                "TypeScript",
                "Tailwind CSS v4",
                "shadcn/ui",
                "next-themes",
                "App Router",
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-1.5 text-xs font-medium text-[var(--muted-foreground)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} {APP_NAME}. Sprint 1.
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Built with Next.js 16
          </p>
        </div>
      </footer>
    </div>
  );
}
