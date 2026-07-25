"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CodeBlockProps {
  language: string;
  children: string;
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  }, [children]);

  return (
    <div className="group relative my-4 rounded-xl border border-white/10 bg-zinc-950 dark:bg-zinc-900 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
        <span className="text-xs font-mono text-zinc-400 select-none tracking-wide">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-all duration-150 rounded px-1.5 py-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
          aria-label={copied ? "Copied" : "Copy code"}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed" tabIndex={0}>
        <code className="font-mono text-zinc-100 whitespace-pre text-[13px]">
          {children}
        </code>
      </pre>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        // Headings
        "prose-headings:font-semibold prose-headings:text-[var(--foreground)] prose-headings:tracking-tight",
        "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
        "prose-headings:mt-5 prose-headings:mb-2.5",
        // Paragraphs
        "prose-p:text-[var(--foreground)] prose-p:leading-7 prose-p:my-2",
        // Links
        "prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-a:no-underline prose-a:font-medium hover:prose-a:underline",
        // Strong / em
        "prose-strong:text-[var(--foreground)] prose-strong:font-semibold",
        "prose-em:text-[var(--foreground)]",
        // Inline code
        "prose-code:text-violet-700 dark:prose-code:text-violet-300",
        "prose-code:bg-violet-50 dark:prose-code:bg-violet-950/40",
        "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md",
        "prose-code:text-[12px] prose-code:font-mono prose-code:font-medium",
        "prose-code:before:content-none prose-code:after:content-none",
        // Pre / code blocks
        "prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-0 prose-pre:border-none",
        // Lists
        "prose-ul:my-3 prose-ol:my-3 prose-li:my-1",
        "prose-li:text-[var(--foreground)] prose-li:leading-7",
        "prose-ul:list-disc prose-ol:list-decimal",
        // Tables
        "prose-table:text-sm prose-table:w-full",
        "prose-th:text-[var(--foreground)] prose-th:font-semibold",
        "prose-td:text-[var(--foreground)]",
        "prose-th:border prose-th:border-[var(--border)] prose-th:px-3 prose-th:py-2 prose-th:bg-[var(--muted)] prose-th:text-left",
        "prose-td:border prose-td:border-[var(--border)] prose-td:px-3 prose-td:py-2",
        "prose-tr:even:bg-[var(--muted)]/30",
        // Blockquote
        "prose-blockquote:border-l-2 prose-blockquote:border-violet-400 prose-blockquote:text-[var(--muted-foreground)] prose-blockquote:pl-4 prose-blockquote:not-italic prose-blockquote:my-3",
        // HR
        "prose-hr:border-[var(--border)] prose-hr:my-4",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className } = props;
            const match = /language-(\w+)/.exec(className ?? "");
            const code = String(children).replace(/\n$/, "");
            const isBlock =
              match !== null || (typeof children === "string" && children.includes("\n"));

            if (isBlock) {
              return <CodeBlock language={match?.[1] ?? ""}>{code}</CodeBlock>;
            }
            return <code className={className}>{children}</code>;
          },
          pre({ children }) {
            return <>{children}</>;
          },
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
          // Better table wrapper for horizontal scroll
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-[var(--border)]">
                <table className="min-w-full divide-y divide-[var(--border)]">
                  {children}
                </table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
