"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, MessageSquare, MoreHorizontal, Pencil, Trash2,
  GitFork, PanelLeftClose, PanelLeft, Pin, Loader2,
  RefreshCw, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useChatStore } from "@/store/chat";
import type { Conversation } from "@/types/chat";
import type { GitHubRepo } from "@/types/github";

interface ConversationSidebarProps {
  repos: GitHubRepo[];
  onNewChat: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

interface RenameInputProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

function RenameInput({ initialValue, onSave, onCancel }: RenameInputProps) {
  const [value, setValue] = React.useState(initialValue);
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onSave(value.trim() || initialValue)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(value.trim() || initialValue);
        if (e.key === "Escape") onCancel();
      }}
      className="w-full bg-[var(--background)] border border-[var(--ring)]/40 rounded px-2 py-0.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
      maxLength={80}
      aria-label="Rename conversation"
    />
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

function ConversationItem({
  conversation, isActive, onSelect, onRename, onDelete, onTogglePin,
}: ConversationItemProps) {
  const [renaming, setRenaming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const handleRename = async (title: string) => {
    setRenaming(false);
    if (title === conversation.title) return;
    const prev = conversation.title;
    onRename(title); // optimistic
    setBusy(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      toast.success("Conversation renamed");
    } catch {
      onRename(prev); // revert
      toast.error("Failed to rename");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    onDelete(); // optimistic
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleTogglePin = async () => {
    const next = !conversation.pinned;
    onTogglePin(); // optimistic
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Conversation pinned" : "Conversation unpinned");
    } catch {
      onTogglePin(); // revert
      toast.error("Failed to update conversation");
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150",
        isActive
          ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
          : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/60",
        busy && "opacity-60 pointer-events-none"
      )}
      onClick={() => !renaming && onSelect()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !renaming) {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-current={isActive ? "true" : undefined}
      aria-label={`Conversation: ${conversation.title}`}
    >
      <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60" aria-hidden="true" />

      <div className="flex-1 min-w-0">
        {renaming ? (
          <RenameInput
            initialValue={conversation.title}
            onSave={handleRename}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <p className="text-xs font-medium truncate leading-snug flex items-center gap-1">
              {conversation.pinned && (
                <Pin className="h-2.5 w-2.5 shrink-0 opacity-60" aria-hidden="true" />
              )}
              {conversation.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <GitFork className="h-2.5 w-2.5 opacity-50 shrink-0" aria-hidden="true" />
              <span className="text-[10px] opacity-50 truncate">{conversation.repoName}</span>
              <time
                dateTime={conversation.updatedAt}
                className="text-[10px] opacity-40 shrink-0 ml-auto"
                title={new Date(conversation.updatedAt).toLocaleString()}
              >
                {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
              </time>
            </div>
          </>
        )}
      </div>

      {!renaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity -mr-1"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Options for ${conversation.title}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
              className="text-xs"
            >
              <Pencil className="h-3.5 w-3.5" />Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); void handleTogglePin(); }}
              className="text-xs"
            >
              <Pin className="h-3.5 w-3.5" />
              {conversation.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); void handleDelete(); }}
              className="text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="px-2 py-2 space-y-1.5" aria-busy="true" aria-label="Loading conversations">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2 px-3 py-2.5">
          <Skeleton className="h-3.5 w-3.5 mt-0.5 rounded shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-2.5 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationSidebar({
  repos: _repos, onNewChat, loading, error, onRetry,
}: ConversationSidebarProps) {
  const {
    conversations, activeConversationId, sidebarOpen, toggleSidebar,
    setActiveConversation, upsertConversation, removeConversation,
  } = useChatStore();

  const grouped = React.useMemo(() => {
    const now = new Date();
    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const older: Conversation[] = [];

    for (const c of conversations) {
      if (c.pinned) { pinned.push(c); continue; }
      const diffDays =
        (now.getTime() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 1) today.push(c);
      else if (diffDays < 2) yesterday.push(c);
      else older.push(c);
    }
    return { pinned, today, yesterday, older };
  }, [conversations]);

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <section key={label} aria-label={`${label} conversations`}>
        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--sidebar-foreground)]/40">
          {label}
        </p>
        <div className="space-y-0.5">
          {items.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActive={c.id === activeConversationId}
              onSelect={() => setActiveConversation(c.id)}
              onRename={(title) => upsertConversation({ ...c, title })}
              onDelete={() => removeConversation(c.id)}
              onTogglePin={() => upsertConversation({ ...c, pinned: !c.pinned })}
            />
          ))}
        </div>
      </section>
    );
  };

  // Collapsed sidebar
  if (!sidebarOpen) {
    return (
      <nav
        className="flex flex-col items-center py-4 px-2 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] h-full gap-2"
        aria-label="Conversations (collapsed)"
      >
        <Button
          variant="ghost" size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-[var(--sidebar-foreground)]"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={onNewChat}
          className="h-8 w-8 text-[var(--sidebar-foreground)]"
          aria-label="New chat"
          title="New chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </nav>
    );
  }

  return (
    <nav
      className="flex flex-col h-full border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] w-64 shrink-0"
      aria-label="Conversations"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--sidebar-border)]">
        <span className="text-xs font-semibold text-[var(--sidebar-foreground)] opacity-70 uppercase tracking-wider">
          Conversations
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            onClick={onNewChat}
            className="h-7 w-7 text-[var(--sidebar-foreground)]"
            aria-label="New conversation"
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 text-[var(--sidebar-foreground)]"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading ? (
          <SidebarSkeleton />
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="h-6 w-6 text-[var(--sidebar-foreground)]/30" aria-hidden="true" />
            <p className="text-xs text-[var(--sidebar-foreground)]/40">{error}</p>
            {onRetry && (
              <Button
                variant="ghost" size="sm"
                onClick={onRetry}
                className="h-7 text-xs gap-1.5"
                aria-label="Retry loading conversations"
              >
                <RefreshCw className="h-3 w-3" />Retry
              </Button>
            )}
          </div>
        ) : conversations.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4"
            role="status"
          >
            <MessageSquare className="h-8 w-8 text-[var(--sidebar-foreground)]/20" aria-hidden="true" />
            <p className="text-xs text-[var(--sidebar-foreground)]/40 leading-relaxed">
              No conversations yet.{" "}
              <br />Select a repository and start chatting.
            </p>
          </div>
        ) : (
          <>
            {renderGroup("Pinned", grouped.pinned)}
            {renderGroup("Today", grouped.today)}
            {renderGroup("Yesterday", grouped.yesterday)}
            {renderGroup("Older", grouped.older)}
          </>
        )}
      </div>
    </nav>
  );
}
