"use client";

import * as React from "react";
import { Eye, EyeOff, GitBranch, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function TokenLoginForm() {
  const { login, validating, error } = useAuth();
  const [token, setToken] = React.useState("");
  const [show, setShow] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(token);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void login(token);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        {/* Header stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500" />

        <div className="p-8">
          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] border border-[var(--border)] mb-4">
              <GitBranch className="h-7 w-7 text-[var(--foreground)]" />
            </div>
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1.5">
              Connect to GitHub
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xs">
              Enter a Personal Access Token with{" "}
              <code className="font-mono text-xs bg-[var(--muted)] px-1.5 py-0.5 rounded">
                repo
              </code>{" "}
              scope to get started.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="pat"
                className="text-xs font-medium text-[var(--foreground)]"
              >
                Personal Access Token
              </label>
              <div className="relative">
                <Input
                  id="pat"
                  ref={inputRef}
                  type={show ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(
                    "pr-10 font-mono text-xs",
                    error && "border-red-500 focus-visible:ring-red-500"
                  )}
                  aria-describedby={error ? "token-error" : undefined}
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  aria-label={show ? "Hide token" : "Show token"}
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div
                  id="token-error"
                  role="alert"
                  className="flex items-start gap-2 mt-2 text-xs text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={validating || !token.trim()}
              aria-busy={validating}
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </form>

          {/* Help link */}
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=RepoChat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Generate a new token on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Security note */}
      <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
        Token is stored locally in your browser only.
      </p>
    </div>
  );
}
