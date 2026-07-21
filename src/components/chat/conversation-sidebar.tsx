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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSave(value.trim() || initialValue);
    if (e.key === "Escape") onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onSave(value.trim() || initialValue)}
      onKeyDown={handleKeyDown}
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
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
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
      aria-label={`Conversation: ${conversation.title}`}
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
            <p className="text-xs font-medium truncate leading-snug">
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
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
              className="text-xs"
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
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

export function ConversationSidebar({ repos: _repos, onNewChat }: ConversationSidebarProps) {
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    toggleSidebar,
    setActiveConversation,
    renameConversation,
    deleteConversation,
  } = useChatStore();

  // Group conversations by date
  const grouped = React.useMemo(() => {
    const now = new Date();
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const older: Conversation[] = [];

    for (const c of conversations) {
      const d = new Date(c.updatedAt);
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 1) today.push(c);
      else if (diffDays < 2) yesterday.push(c);
      else older.push(c);
    }
    return { today, yesterday, older };
  }, [conversations]);

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-4 px-2 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] h-full gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-[var(--sidebar-foreground)]"
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="h-8 w-8 text-[var(--sidebar-foreground)]"
          aria-label="New chat"
          title="New chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

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
              onRename={(title) => renameConversation(c.id, title)}
              onDelete={() => deleteConversation(c.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] w-64 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--sidebar-border)]">
        <span className="text-xs font-semibold text-[var(--sidebar-foreground)] opacity-70 uppercase tracking-wider">
          Conversations
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="h-7 w-7 text-[var(--sidebar-foreground)]"
            aria-label="New chat"
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 text-[var(--sidebar-foreground)]"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12 text-center px-4">
            <MessageSquare className="h-8 w-8 text-[var(--sidebar-foreground)]/20" />
            <p className="text-xs text-[var(--sidebar-foreground)]/40 leading-relaxed">
              No conversations yet. Select a repository and start chatting.
            </p>
          </div>
        ) : (
          <>
            {renderGroup("Today", grouped.today)}
            {renderGroup("Yesterday", grouped.yesterday)}
            {renderGroup("Older", grouped.older)}
          </>
        )}
      </div>
    </div>
  );
}
