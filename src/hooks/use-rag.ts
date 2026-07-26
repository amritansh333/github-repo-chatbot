"use client";

import * as React from "react";
import { toast } from "sonner";
import type { GitHubRepo } from "@/types/github";

type IndexState = "idle" | "checking" | "indexing" | "indexed" | "error";

export function useRag(repo: GitHubRepo | null) {
  const [state, setState] = React.useState<IndexState>("idle");
  const [progress, setProgress] = React.useState<string | null>(null);
  const indexedRef = React.useRef<Set<string>>(new Set());

  // Check + auto-index when repo changes
  React.useEffect(() => {
    if (!repo) return;
    const key = `${repo.full_name}@${repo.default_branch}`;
    if (indexedRef.current.has(key)) {
      setState("indexed");
      return;
    }

    let cancelled = false;
    setState("checking");

    void (async () => {
      try {
        // Check if already indexed
        const checkRes = await fetch(
          `/api/rag?repo=${encodeURIComponent(repo.full_name)}&branch=${encodeURIComponent(repo.default_branch)}`
        );
        if (!checkRes.ok || cancelled) return;
        const { indexed } = await checkRes.json() as { indexed: boolean };

        if (indexed) {
          indexedRef.current.add(key);
          if (!cancelled) setState("indexed");
          return;
        }

        // Trigger indexing
        if (!cancelled) {
          setState("indexing");
          setProgress("Indexing repository for semantic search…");
        }

        const indexRes = await fetch("/api/rag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repoOwner: repo.owner.login,
            repoName: repo.name,
            repoFullName: repo.full_name,
            repoBranch: repo.default_branch,
          }),
        });

        if (cancelled) return;

        if (!indexRes.ok) {
          const err = await indexRes.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? "Indexing failed");
        }

        const result = await indexRes.json() as {
          status: string;
          chunksIndexed?: number;
          filesIndexed?: number;
        };

        indexedRef.current.add(key);
        setState("indexed");
        setProgress(null);

        if (result.chunksIndexed && result.chunksIndexed > 0) {
          toast.success(
            `Repository indexed: ${result.filesIndexed ?? 0} files, ${result.chunksIndexed} chunks`,
            { duration: 4000 }
          );
        }
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setProgress(null);
        // Non-fatal — chat still works with file-based context
        console.warn("RAG indexing failed (chat will use file-based context):", err);
      }
    })();

    return () => { cancelled = true; };
  }, [repo?.full_name, repo?.default_branch]);

  const reindex = React.useCallback(async () => {
    if (!repo) return;
    const key = `${repo.full_name}@${repo.default_branch}`;
    indexedRef.current.delete(key);
    setState("indexing");
    setProgress("Re-indexing repository…");

    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoOwner: repo.owner.login,
          repoName: repo.name,
          repoFullName: repo.full_name,
          repoBranch: repo.default_branch,
          force: true,
        }),
      });

      if (!res.ok) throw new Error("Re-indexing failed");

      const result = await res.json() as { chunksIndexed?: number; filesIndexed?: number };
      indexedRef.current.add(key);
      setState("indexed");
      setProgress(null);
      toast.success(`Re-indexed: ${result.filesIndexed ?? 0} files, ${result.chunksIndexed ?? 0} chunks`);
    } catch {
      setState("error");
      setProgress(null);
      toast.error("Re-indexing failed. Chat will use file-based context.");
    }
  }, [repo]);

  return { state, progress, reindex, isIndexed: state === "indexed" };
}
