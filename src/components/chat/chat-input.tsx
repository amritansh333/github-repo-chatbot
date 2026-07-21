"use client";

import * as React from "react";
import { ArrowUp, Square, Paperclip } from "lucide-react";
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
  "Explain the overall architecture of this repository",
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

  // Auto-resize textarea
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
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isStreaming, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setValue(suggestion);
    textareaRef.current?.focus();
  };

  const isEmpty = !value.trim();

  return (
    <div className="space-y-3">
      {/* Suggestions — show only when input is empty */}
      {isEmpty && !isStreaming && (
        <div className="flex flex-wrap gap-2 justify-center px-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              disabled={disabled}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--ring)]/30 hover:bg-[var(--accent)] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm transition-all duration-200",
          "focus-within:border-[var(--ring)]/40 focus-within:shadow-md",
          disabled && "opacity-50"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          rows={1}
          aria-label="Chat message"
          aria-multiline="true"
          className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none leading-relaxed max-h-48 overflow-y-auto disabled:cursor-not-allowed"
        />

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isStreaming ? (
            <Button
              size="icon"
              variant="outline"
              onClick={onStop}
              className="h-8 w-8 rounded-xl border-[var(--border)]"
              aria-label="Stop generating"
              title="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isEmpty || disabled}
              className={cn(
                "h-8 w-8 rounded-xl transition-all duration-200",
                isEmpty
                  ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                  : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
              )}
              aria-label="Send message"
              title="Send (Enter)"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-[var(--muted-foreground)]">
        <kbd className="font-mono">Enter</kbd> to send · <kbd className="font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
