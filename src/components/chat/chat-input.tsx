"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const SUGGESTIONS = [
  "Explain the overall architecture",
  "Summarize the README",
  "Explain the folder structure",
  "Find authentication logic",
  "Explain state management",
  "Show the main API routes",
];

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder = "Ask anything about this repository…",
}: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleSend = React.useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, isStreaming, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Escape clears input
    if (e.key === "Escape") {
      setValue("");
    }
  };

  const isEmpty = !value.trim();

  return (
    <div className="space-y-2.5">
      {/* Suggestions */}
      {isEmpty && !isStreaming && !disabled && (
        <div
          className="flex flex-wrap gap-2 justify-center px-2"
          role="list"
          aria-label="Suggested questions"
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              role="listitem"
              onClick={() => {
                setValue(s);
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-violet-300 dark:hover:border-violet-700 hover:bg-[var(--accent)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-label={`Ask: ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm",
          "transition-all duration-200",
          "focus-within:border-violet-300 dark:focus-within:border-violet-700 focus-within:shadow-md focus-within:shadow-violet-500/5",
          (disabled && !isStreaming) && "opacity-50 pointer-events-none"
        )}
        role="form"
        aria-label="Chat input"
      >
        <label htmlFor="chat-textarea" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-textarea"
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          rows={1}
          aria-label="Chat message"
          aria-multiline="true"
          aria-describedby="chat-hint"
          className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none leading-relaxed max-h-48 overflow-y-auto disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-1 shrink-0">
          {isStreaming ? (
            <Button
              size="icon"
              variant="outline"
              onClick={onStop}
              className="h-8 w-8 rounded-xl border-[var(--border)] hover:border-red-300 hover:text-red-500 transition-colors"
              aria-label="Stop generating"
              title="Stop generating (Esc)"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isEmpty || disabled}
              className={cn(
                "h-8 w-8 rounded-xl transition-all duration-200 shadow-sm",
                isEmpty || disabled
                  ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed shadow-none"
                  : "bg-gradient-to-br from-violet-500 to-blue-600 text-white hover:opacity-90 hover:shadow-md hover:shadow-violet-500/20"
              )}
              aria-label="Send message"
              title="Send (Enter)"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p id="chat-hint" className="text-center text-[10px] text-[var(--muted-foreground)]">
        <kbd className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded text-[9px]">Enter</kbd>
        {" "}to send ·{" "}
        <kbd className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded text-[9px]">Shift+Enter</kbd>
        {" "}for new line ·{" "}
        <kbd className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded text-[9px]">Esc</kbd>
        {" "}to clear
      </p>
    </div>
  );
}
