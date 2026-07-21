"use client";

import * as React from "react";
import { Check, Copy, RotateCcw, Trash2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./markdown-renderer";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  isLast: boolean;
  isStreaming: boolean;
  onRetry?: () => void;
  onDelete?: () => void;
}

export const ChatMessageComponent = React.memo(function ChatMessage({
  message,
  isLast,
  isStreaming,
  onRetry,
  onDelete,
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-4 rounded-xl transition-colors",
        isUser
          ? "flex-row-reverse"
          : "flex-row",
        message.error && "border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold mt-0.5",
          isUser
            ? "bg-gradient-to-br from-violet-500 to-blue-600"
            : "bg-gradient-to-br from-emerald-500 to-teal-600"
        )}
        aria-hidden
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex justify-end")}>
        {isUser ? (
          <div className="inline-block max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="space-y-1">
            {message.isStreaming && !message.content ? (
              <TypingIndicator />
            ) : (
              <MarkdownRenderer content={message.content} />
            )}

            {/* Streaming cursor */}
            {message.isStreaming && message.content && (
              <span className="inline-block w-0.5 h-4 bg-[var(--foreground)] animate-pulse align-middle ml-0.5" />
            )}

            {/* Error state */}
            {message.error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Failed to generate response.
              </p>
            )}

            {/* Actions — shown on hover when not streaming */}
            {isAssistant && !isStreaming && (
              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  onClick={handleCopy}
                  aria-label="Copy response"
                  title="Copy"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                {onRetry && isLast && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    onClick={onRetry}
                    aria-label="Retry response"
                    title="Retry"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[var(--muted-foreground)] hover:text-red-500"
                    onClick={onDelete}
                    aria-label="Delete message"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-[var(--muted-foreground)] animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }}
        />
      ))}
    </div>
  );
}
