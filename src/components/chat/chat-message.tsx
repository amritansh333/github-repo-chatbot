"use client";

import * as React from "react";
import { Check, Copy, RotateCcw, Trash2, Bot, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./markdown-renderer";
import { toast } from "sonner";
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
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [message.content]);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-3 rounded-xl animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row",
        message.error &&
          "border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10"
      )}
      role="article"
      aria-label={`${isUser ? "You" : "AI"}: ${message.content.slice(0, 100)}`}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold mt-0.5 shadow-sm",
          isUser
            ? "bg-gradient-to-br from-violet-500 to-blue-600"
            : "bg-gradient-to-br from-emerald-500 to-teal-600"
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex justify-end")}>
        {isUser ? (
          <div className="inline-block max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-sm leading-relaxed shadow-sm">
            {message.content}
          </div>
        ) : (
          <div className="space-y-1">
            {message.isStreaming && !message.content ? (
              <TypingIndicator />
            ) : message.error ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Failed to generate response
                  </p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                    {message.content}
                  </p>
                </div>
              </div>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}

            {/* Streaming cursor */}
            {message.isStreaming && message.content && (
              <span
                className="inline-block w-0.5 h-4 bg-[var(--foreground)] animate-pulse align-middle ml-0.5"
                aria-hidden="true"
              />
            )}

            {/* Action buttons — visible on hover */}
            {isAssistant && !isStreaming && !message.error && message.content && (
              <div
                className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
                role="toolbar"
                aria-label="Message actions"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  onClick={handleCopy}
                  aria-label={copied ? "Copied" : "Copy response"}
                  title="Copy response"
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
                    onClick={() => {
                      onRetry();
                      toast.info("Retrying…");
                    }}
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
                    onClick={() => {
                      onDelete();
                      toast.success("Message deleted");
                    }}
                    aria-label="Delete message"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}

            {/* Retry on error */}
            {message.error && onRetry && isLast && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onRetry(); toast.info("Retrying…"); }}
                className="mt-2 h-8 text-xs gap-1.5"
                aria-label="Retry generating response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 py-3 px-1"
      role="status"
      aria-label="AI is typing"
      aria-live="polite"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
          style={{ animationDelay: `${i * 160}ms`, animationDuration: "900ms" }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">AI is generating a response</span>
    </div>
  );
}
