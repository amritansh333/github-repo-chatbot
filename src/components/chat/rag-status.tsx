"use client";

import * as React from "react";
import { Cpu, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RagStatusProps {
  state: "idle" | "checking" | "indexing" | "indexed" | "error";
  progress: string | null;
  onReindex: () => void;
  className?: string;
}

export function RagStatus({ state, progress, onReindex, className }: RagStatusProps) {
  if (state === "idle" || state === "checking") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
        state === "indexing" &&
          "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300",
        state === "indexed" &&
          "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400",
        state === "error" &&
          "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`RAG status: ${state}`}
    >
      {state === "indexing" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden="true" />
          <span>{progress ?? "Indexing…"}</span>
        </>
      )}
      {state === "indexed" && (
        <>
          <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Semantic search active</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-transparent"
            onClick={onReindex}
            aria-label="Re-index repository"
            title="Re-index repository"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </>
      )}
      {state === "error" && (
        <>
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Semantic search unavailable</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-transparent"
            onClick={onReindex}
            aria-label="Retry indexing"
            title="Retry indexing"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}
