"use client";

import * as React from "react";
import { Bot, GitFork, ChevronDown, Lock, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessageComponent } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";
import { getLanguageColor } from "@/lib/language-colors";
import { Skeleton } from "@/components/ui/skeleton";
import type { GitHubRepo } from "@/types/github";

interface ChatWindowProps {
  conversationId: string | null;
  repo: GitHubRepo | null;
  onFirstMessage: (content: string) => Promise<string>;
}

// Pending message waiting for conversation to be created
const pendingRef = { content: "" };

export function ChatWindow({ conversationId, repo, onFirstMessage }: ChatWindowProps) {
  const { messages, isStreaming, sendMessage, stopStreaming, retryLast, deleteMessage } =
    useChat({ conversationId, repo });

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = React.useState(false);
  const [creatingConv, setCreatingConv] = React.useState(false);
  const prevConvIdRef = React.useRef<string | null>(null);

  // When conversationId changes (new conv created), send the pending message
  React.useEffect(() => {
    const prev = prevConvIdRef.current;
    prevConvIdRef.current = conversationId;
    if (conversationId && !prev && pendingRef.content) {
      const content = pendingRef.content;
      pendingRef.content = "";
      void sendMessage(content);
    }
  }, [conversationId, sendMessage]);

  // Auto-scroll to bottom
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  React.useEffect(() => {
    if (!showScrollBtn) scrollToBottom();
  }, [messages.length, isStreaming, showScrollBtn, scrollToBottom]);

  // Detect scroll position
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    };
    el.addEventListener("scroll", handle, { passive: true });
    return () => el.removeEventListener("scroll", handle);
  }, []);

  // Always scroll when streaming starts
  React.useEffect(() => {
    if (isStreaming) {
      setShowScrollBtn(false);
      scrollToBottom();
    }
  }, [isStreaming, scrollToBottom]);

  const handleSend = React.useCallback(
    async (content: string) => {
      if (!repo) return;

      if (!conversationId) {
        setCreatingConv(true);
        pendingRef.content = content;
        const id = await onFirstMessage(content);
        setCreatingConv(false);
        if (!id) {
          pendingRef.content = "";
        }
        // sendMessage is triggered by the useEffect above when conversationId changes
        return;
      }

      await sendMessage(content);
    },
    [repo, conversationId, onFirstMessage, sendMessage]
  );

  // ── No repo selected ──────────────────────────────────────────────────────
  if (!repo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-[var(--border)]">
          <GitFork className="h-8 w-8 text-violet-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1.5">
            Select a repository
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs leading-relaxed">
            Choose a GitHub repository above to start an AI-powered conversation about the code.
          </p>
        </div>
        {/* Feature hints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm mt-2" aria-hidden="true">
          {["Explain the architecture", "Summarize README", "Find auth logic", "Trace data flow"].map((hint) => (
            <div key={hint} className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 px-3 py-2 text-xs text-[var(--muted-foreground)] text-center">
              {hint}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty conversation (repo selected, no messages) ───────────────────────
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 sm:p-8 text-center">
          {/* Repo pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--card)] shadow-sm">
            {repo.language && (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getLanguageColor(repo.language) }}
                aria-hidden="true"
              />
            )}
            <span className="text-sm font-semibold text-[var(--foreground)] truncate max-w-[180px] sm:max-w-none">
              {repo.full_name}
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]" aria-label={repo.private ? "Private repository" : "Public repository"}>
              {repo.private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              <span className="hidden sm:inline">{repo.default_branch}</span>
            </span>
          </div>

          {creatingConv ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-sm text-[var(--muted-foreground)]">Starting conversation…</p>
            </div>
          ) : (
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg mx-auto mb-4">
                <Bot className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                Ready to explore{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
                  {repo.name}
                </span>
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm leading-relaxed">
                Ask anything about this codebase — architecture, files, patterns, or how things work.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          <ChatInput
            onSend={handleSend}
            onStop={stopStreaming}
            isStreaming={false}
            disabled={creatingConv}
            placeholder={`Ask anything about ${repo.name}…`}
          />
        </div>
      </div>
    );
  }

  // ── Active conversation ────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
        aria-atomic="false"
      >
        <div className="max-w-3xl mx-auto py-4 space-y-0.5 px-2 sm:px-0">
          {messages.map((msg, idx) => (
            <ChatMessageComponent
              key={msg.id}
              message={msg}
              isLast={idx === messages.length - 1}
              isStreaming={isStreaming && idx === messages.length - 1}
              onRetry={
                msg.role === "assistant" && idx === messages.length - 1
                  ? retryLast
                  : undefined
              }
              onDelete={() => deleteMessage(msg.id)}
            />
          ))}
          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
          <button
            onClick={() => { setShowScrollBtn(false); scrollToBottom(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs shadow-lg hover:shadow-xl hover:bg-[var(--accent)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label="Scroll to latest message"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Latest message
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-[var(--border)] p-3 sm:p-4 bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSend}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            placeholder={`Ask about ${repo.name}…`}
          />
        </div>
      </div>
    </div>
  );
}
