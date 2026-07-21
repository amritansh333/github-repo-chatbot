"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language: string;
  children: string;
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="group relative my-4 rounded-xl border border-[var(--border)] bg-zinc-950 dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs font-mono text-zinc-400 select-none">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code */}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-zinc-100 whitespace-pre">{children}</code>
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
        "prose prose-sm dark:prose-invert max-w-none leading-relaxed",
        "prose-headings:font-semibold prose-headings:text-[var(--foreground)] prose-headings:mt-4 prose-headings:mb-2",
        "prose-p:text-[var(--foreground)] prose-p:leading-relaxed prose-p:my-2",
        "prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-[var(--foreground)] prose-strong:font-semibold",
        "prose-code:text-violet-700 dark:prose-code:text-violet-300 prose-code:bg-violet-50 dark:prose-code:bg-violet-950/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-0",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
        "prose-li:text-[var(--foreground)]",
        "prose-table:text-sm prose-th:text-[var(--foreground)] prose-td:text-[var(--foreground)]",
        "prose-th:border prose-th:border-[var(--border)] prose-th:px-3 prose-th:py-2 prose-th:bg-[var(--muted)]",
        "prose-td:border prose-td:border-[var(--border)] prose-td:px-3 prose-td:py-2",
        "prose-blockquote:border-l-2 prose-blockquote:border-violet-400 prose-blockquote:text-[var(--muted-foreground)] prose-blockquote:pl-4 prose-blockquote:not-italic",
        "prose-hr:border-[var(--border)]",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks vs inline code
          code(props) {
            const { children, className } = props;
            const match = /language-(\w+)/.exec(className ?? "");
            const isBlock = match !== null || (typeof children === "string" && children.includes("\n"));

            if (isBlock) {
              const lang = match?.[1] ?? "";
              return (
                <CodeBlock language={lang}>
                  {String(children).replace(/\n$/, "")}
                </CodeBlock>
              );
            }
            return (
              <code className={className}>
                {children}
              </code>
            );
          },
          // Override pre to avoid double wrapping
          pre({ children }) {
            return <>{children}</>;
          },
          // External links open in new tab
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
