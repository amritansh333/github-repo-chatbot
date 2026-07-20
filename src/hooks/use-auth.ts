"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useReposStore } from "@/store/repos";
import { validateToken, GitHubApiError } from "@/lib/github";

export function useAuth() {
  const router = useRouter();
  const { token, user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const clearRepos = useReposStore((s) => s.clearRepos);
  const [validating, setValidating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const login = React.useCallback(
    async (pat: string) => {
      setValidating(true);
      setError(null);
      try {
        const trimmed = pat.trim();
        if (!trimmed) throw new Error("Token cannot be empty");
        const userData = await validateToken(trimmed);
        setAuth(trimmed, userData);
        router.push("/dashboard");
      } catch (err) {
        if (err instanceof GitHubApiError && err.status === 401) {
          setError("Invalid token — check your Personal Access Token and try again.");
        } else {
          setError(err instanceof Error ? err.message : "Authentication failed");
        }
      } finally {
        setValidating(false);
      }
    },
    [setAuth, router]
  );

  const logout = React.useCallback(() => {
    clearAuth();
    clearRepos();
    router.push("/");
  }, [clearAuth, clearRepos, router]);

  return { token, user, isAuthenticated, validating, error, login, logout };
}
