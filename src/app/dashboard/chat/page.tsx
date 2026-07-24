"use client";

import * as React from "react";
import { GitBranch, Plus, Lock, Globe, AlertTriangle, ExternalLink } from "lucide-react";
import { useChatStore } from "@/store/chat";
import { useRepos } from "@/hooks/use-repos";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { RepoSelector } from "@/components/chat/repo-selector";
import { Button } from "@/components/ui/button";
import { getLanguageColor } from "@/lib/language-colors";
import type { GitHubRepo } from "@/types/github";
import type { Conversation } from "@/types/chat";
import Link from "next/link";

export default function ChatPage() {
  const {
    conversations,
    selectedRepo,
    activeConversationId,
    sidebarOpen,
    setSelectedRepo,
    setActiveConversation,
    setConversations,
    upsertConversation,
  } = useChatStore();

  const { allRepos, loading: reposLoading, hasToken } = useRepos();
  const [convLoading, setConvLoading] = React.useState(true);

  // Load conversations from DB on mount
  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return;
        const data = await res.json() as Array<Conversation & { messages?: [] }>;
        // Map DB rows to local Conversation shape with empty messages array
        const convs: Conversation[] = data.map((c) => ({
          ...c,
          messages: [],
        }));
        setConversations(convs);
      } catch {
        // non-fatal
      } finally {
        setConvLoading(false);
      }
    })();
  }, [setConversations]);

  // When a conversation is selected, load its messages
  React.useEffect(() => {
    if (!activeConversationId) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv || conv.messages.length > 0) return; // already loaded

    void (async () => {
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}/messages`);
        if (!res.ok) return;
        const msgs = await res.json() as Array<{ id: string; role: string; content: string; createdAt: string }>;
        const mapped = msgs.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }));
        upsertConversation({ ...conv, messages: mapped });
      } catch {
        // non-fatal
      }
    })();
  }, [activeConversationId, conversations, upsertConversation]);

  const handleSelectRepo = React.useCallback(
    (repo: GitHubRepo) => {
      setSelectedRepo(repo);
      setActiveConversation(null);
    },
    [setSelectedRepo, setActiveConversation]
  );

  const handleClearRepo = React.useCallback(() => {
    setSelectedRepo(null);
    setActiveConversation(null);
  }, [setSelectedRepo, setActiveConversation]);

  const handleNewChat = React.useCallback(() => {
    setActiveConversation(null);
  }, [setActiveConversation]);

  // Called by ChatWindow on first message — creates conversation in DB then locally
  const handleFirstMessage = React.useCallback(
    async (content: string): Promise<string> => {
      if (!selectedRepo) return "";
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: content.trim().slice(0, 60),
            repoFullName: selectedRepo.full_name,
            repoOwner: selectedRepo.owner.login,
            repoName: selectedRepo.name,
            repoBranch: selectedRepo.default_branch,
            repoLanguage: selectedRepo.language,
            repoPrivate: selectedRepo.private,
          }),
        });
        if (!res.ok) throw new Error("Failed to create conversation");
        const conv = await res.json() as Conversation;
        const localConv: Conversation = { ...conv, messages: [] };
        upsertConversation(localConv);
        setActiveConversation(conv.id);
        return conv.id;
      } catch {
        return "";
      }
    },
    [selectedRepo, upsertConversation, setActiveConversation]
  );

  // No token warning
  if (hasToken === false) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 -m-4 sm:-m-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/20 mx-auto">
            <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            GitHub token required
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            To browse repositories and chat, you need to add a GitHub Personal
            Access Token in Settings.
          </p>
          <Button asChild className="gap-2">
            <Link href="/dashboard/settings">
              <ExternalLink className="h-4 w-4" />
              Go to Settings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 -m-4 sm:-m-6">
      <ConversationSidebar
        repos={allRepos}
        onNewChat={handleNewChat}
        loading={convLoading}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
          <div className="flex-1 max-w-lg">
            <RepoSelector
              repos={allRepos}
              selected={selectedRepo}
              onSelect={handleSelectRepo}
              onClear={handleClearRepo}
              loading={reposLoading && allRepos.length === 0}
            />
          </div>

          {selectedRepo && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                {selectedRepo.default_branch}
              </span>
              {selectedRepo.language && (
                <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getLanguageColor(selectedRepo.language) }}
                  />
                  {selectedRepo.language}
                </span>
              )}
              {selectedRepo.private ? (
                <Lock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            disabled={!selectedRepo}
            className="gap-1.5 h-8 text-xs shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </Button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
          <ChatWindow
            conversationId={activeConversationId}
            repo={selectedRepo}
            onFirstMessage={handleFirstMessage}
          />
        </div>
      </div>
    </div>
  );
}
