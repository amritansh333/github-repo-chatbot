"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  GitFork,
  PanelLeftClose,
  PanelLeft,
  Pin,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat";
import type { Conversation } from "@/types/chat";
import type { GitHubRepo } from "@/types/github";

interface ConversationSidebarProps {
  repos: GitHubRepo[];
  onNewChat: () => void;
  loading?: boolean;
}

interface RenameInputProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

function RenameInput({ initialValue, onSave, onCancel }: RenameInputProps) {
  const [value, setValue] = React.useState(initialValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
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
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
}: ConversationItemProps) {
  const [renaming, setRenaming] = React.useState(false);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-all",
        isActive
          ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
          : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/60"
      )}
      onClick={() => !renaming && onSelect()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && !renaming && onSelect()}
      aria-current={isActive ? "true" : undefined}
    >
      <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60" />

      <div className="flex-1 min-w-0">
        {renaming ? (
          <RenameInput
            initialValue={conversation.title}
            onSave={(v) => { onRename(v); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <p className="text-xs font-medium truncate leading-snug flex items-center gap-1">
              {conversation.pinned && <Pin className="h-2.5 w-2.5 shrink-0 opacity-60" />}
              {conversation.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <GitFork className="h-2.5 w-2.5 opacity-50 shrink-0" />
              <span className="text-[10px] opacity-50 truncate">
                {conversation.repoName}
              </span>
              <span className="text-[10px] opacity-40 shrink-0 ml-auto">
                {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
              </span>
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
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
              onClick={(e) => e.stopPropagation()}
              aria-label="Conversation options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenaming(true); }} className="text-xs">
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(); }} className="text-xs">
              <Pin className="h-3.5 w-3.5" />
              {conversation.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function ConversationSidebar({ repos: _repos, onNewChat, loading }: ConversationSidebarProps) {
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    toggleSidebar,
    setActiveConversation,
    upsertConversation,
    removeConversation,
  } = useChatStore();

  const handleRename = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) return;
      const updated = await res.json() as Conversation;
      const conv = conversations.find((c) => c.id === id);
      if (conv) upsertConversation({ ...conv, title: updated.title });
    } catch { /* non-fatal */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      removeConversation(id);
    } catch { /* non-fatal */ }
  };

  const handleTogglePin = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !conv.pinned }),
      });
      if (!res.ok) return;
      const updated = await res.json() as Conversation;
      upsertConversation({ ...conv, pinned: updated.pinned });
    } catch { /* non-fatal */ }
  };

  const grouped = React.useMemo(() => {
    const now = new Date();
    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const older: Conversation[] = [];

    for (const c of conversations) {
      if (c.pinned) { pinned.push(c); continue; }
      const diffDays = (now.getTime() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 1) today.push(c);
      else if (diffDays < 2) yesterday.push(c);
      else older.push(c);
    }
    return { pinned, today, yesterday, older };
  }, [conversations]);

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label}>
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
              onRename={(title) => void handleRename(c.id, title)}
              onDelete={() => void handleDelete(c.id)}
              onTogglePin={() => void handleTogglePin(c.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-4 px-2 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] h-full gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 text-[var(--sidebar-foreground)]" aria-label="Open sidebar">
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNewChat} className="h-8 w-8 text-[var(--sidebar-foreground)]" aria-label="New chat">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] w-64 shrink-0">
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--sidebar-border)]">
        <span className="text-xs font-semibold text-[var(--sidebar-foreground)] opacity-70 uppercase tracking-wider">
          Conversations
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onNewChat} className="h-7 w-7 text-[var(--sidebar-foreground)]" aria-label="New chat">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7 text-[var(--sidebar-foreground)]" aria-label="Close sidebar">
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--sidebar-foreground)]/30" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12 text-center px-4">
            <MessageSquare className="h-8 w-8 text-[var(--sidebar-foreground)]/20" />
            <p className="text-xs text-[var(--sidebar-foreground)]/40 leading-relaxed">
              No conversations yet. Select a repository and start chatting.
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
    </div>
  );
}
