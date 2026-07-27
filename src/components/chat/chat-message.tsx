"use client";

import * as React from "react";
import {
  Check, Copy, RotateCcw, Trash2, Bot, User, AlertCircle, Pencil, X,
} from "lucide-react";
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
  onEdit?: (messageId: string, newContent: string) => void;
}

export const ChatMessageComponent = React.memo(function ChatMessage({
  message, isLast, isStreaming, onRetry, onDelete, onEdit,
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(message.content);
  const editRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(editRef.current.value.length, editRef.current.value.length);
    }
  }, [editing]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy"); }
  }, [message.content]);

  const handleEditSubmit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === message.content) { setEditing(false); return; }
    onEdit?.(message.id, trimmed);
    setEditing(false);
  };

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "group flex gap-3 px-3 sm:px-4 py-3 rounded-xl animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row",
        message.error && "border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10"
      )}
      role="article"
      aria-label={`${isUser ? "You" : "AI"}`}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold mt-0.5 shadow-sm",
          isUser ? "bg-gradient-to-br from-violet-500 to-blue-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
        {isUser ? (
          editing ? (
            <div className="w-full max-w-[85%] space-y-2">
              <textarea
                ref={editRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                  if (e.key === "Escape") { setEditing(false); setEditValue(message.content); }
                }}
                className="w-full rounded-xl border border-violet-300 dark:border-violet-700 bg-[var(--card)] text-sm text-[var(--foreground)] px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                rows={Math.min(6, message.content.split("\n").length + 1)}
                aria-label="Edit message"
              />
              <div className="flex gap-1.5 justify-end">
                <Button size="sm" className="h-7 text-xs gap-1" onClick={handleEditSubmit} disabled={!editValue.trim()}>
                  <Check className="h-3 w-3" />Send
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { setEditing(false); setEditValue(message.content); }}>
                  <X className="h-3 w-3" />Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group/msg max-w-[85%]">
              <div className="inline-block rounded-2xl rounded-tr-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-sm leading-relaxed shadow-sm">
                {message.content}
                {message.editedAt && (
                  <span className="text-[10px] opacity-50 ml-2">(edited)</span>
                )}
              </div>
              {/* Edit button for user messages */}
              {!isStreaming && onEdit && (
                <button
                  onClick={() => { setEditing(true); setEditValue(message.content); }}
                  className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  aria-label="Edit message"
                  title="Edit and resend"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        ) : (
          <div className="space-y-1 min-w-0 w-full">
            {message.isStreaming && !message.content ? (
              <TypingIndicator />
            ) : message.error ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Failed to generate response</p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">{message.content}</p>
                </div>
              </div>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}

            {message.isStreaming && message.content && (
              <span className="inline-block w-0.5 h-4 bg-emerald-500 animate-pulse align-middle ml-0.5" aria-hidden="true" />
            )}

            {isAssistant && !isStreaming && !message.error && message.content && (
              <div
                className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
                role="toolbar"
                aria-label="Message actions"
              >
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  onClick={handleCopy} aria-label={copied ? "Copied" : "Copy"} title="Copy response">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                {onRetry && isLast && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    onClick={() => { onRetry(); toast.info("Regenerating…"); }} aria-label="Regenerate" title="Regenerate response">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--muted-foreground)] hover:text-red-500"
                    onClick={() => { onDelete(); toast.success("Message deleted"); }} aria-label="Delete" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}

            {message.error && onRetry && isLast && (
              <Button variant="outline" size="sm" onClick={() => { onRetry(); toast.info("Retrying…"); }}
                className="mt-2 h-8 text-xs gap-1.5" aria-label="Retry">
                <RotateCcw className="h-3.5 w-3.5" />Try again
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
    <div className="flex items-center gap-1.5 py-2.5 px-1" role="status" aria-label="AI is thinking" aria-live="polite">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
          style={{ animationDelay: `${i * 160}ms`, animationDuration: "900ms" }} aria-hidden="true" />
      ))}
      <span className="sr-only">AI is generating a response</span>
    </div>
  );
}
