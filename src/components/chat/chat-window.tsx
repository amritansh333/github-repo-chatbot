"use client";

import * as React from "react";
import { Bot, GitFork, Sparkles, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessageComponent } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";
import { getLanguageColor } from "@/lib/language-colors";
import type { GitHubRepo } from "@/types/github";

interface ChatWindowProps {
  conversationId: string | null;
  repo: GitHubRepo | null;
  onFirstMessage: (content: string) => Promise<string>;
}

export function ChatWindow({ conversationId, repo, onFirstMessage }: ChatWindowProps) {
  const { messages, isStreaming, sendMessage, stopStreaming, retryLast, deleteMessage } =
    useChat({ conversationId, repo });

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = React.useState(false);
  const activeConvIdRef = React.useRef<string | null>(conversationId);

  React.useEffect(() => { activeConvIdRef.current = conversationId; }, [conversationId]);

  React.useEffect(() => {
    if (userScrolled) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, userScrolled]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setUserScrolled(distFromBottom > 100);
    };
    el.addEventListener("scroll", handle, { passive: true });
    return () => el.removeEventListener("scroll", handle);
  }, []);

  React.useEffect(() => {
    if (isStreaming) setUserScrolled(false);
  }, [isStreaming]);

  const handleSend = React.useCallback(
    async (content: string) => {
      let activeId = activeConvIdRef.current;
      if (!activeId && repo) {
        activeId = await onFirstMessage(content);
        if (!activeId) return;
        // sendMessage will be called after the conversationId prop updates
        // We need to wait for re-render, so we store content and send on next effect
        return;
      }
      if (!activeId || !repo) return;
      await sendMessage(content);
    },
    [repo, onFirstMessage, sendMessage]
  );

  if (!repo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-[var(--border)]">
          <GitFork className="h-8 w-8 text-violet-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1.5">Select a repository</h2>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs leading-relaxed">
            Choose a GitHub repository from the dropdown above to start an AI-powered conversation about the code.
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--card)]">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(repo.language) }} />
            <span className="text-sm font-semibold text-[var(--foreground)]">{repo.full_name}</span>
            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              {repo.private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              {repo.default_branch}
            </span>
          </div>
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg mx-auto mb-4">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Ready to explore{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">{repo.name}</span>
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm leading-relaxed">
              Ask anything about this repository — architecture, code, files, patterns, or how things work.
            </p>
          </div>
        </div>
        <div className="p-4 border-t border-[var(--border)]">
          <ChatInput onSend={handleSend} onStop={stopStreaming} isStreaming={false} placeholder={`Ask anything about ${repo.name}…`} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto" role="log" aria-label="Chat messages" aria-live="polite">
        <div className="max-w-3xl mx-auto py-4 space-y-1">
          {messages.map((msg, idx) => (
            <ChatMessageComponent
              key={msg.id}
              message={msg}
              isLast={idx === messages.length - 1}
              isStreaming={isStreaming && idx === messages.length - 1}
              onRetry={msg.role === "assistant" && idx === messages.length - 1 ? retryLast : undefined}
              onDelete={() => deleteMessage(msg.id)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {userScrolled && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <button
            onClick={() => { setUserScrolled(false); bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs shadow-lg hover:opacity-90"
          >
            <Sparkles className="h-3 w-3" />Scroll to latest
          </button>
        </div>
      )}

      <div className={cn("border-t border-[var(--border)] p-4", "bg-[var(--background)]/80 backdrop-blur-sm")}>
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={handleSend} onStop={stopStreaming} isStreaming={isStreaming} placeholder={`Ask about ${repo.name}…`} />
        </div>
      </div>
    </div>
  );
}
