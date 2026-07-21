"use client";

import * as React from "react";
import { GitBranch, Plus, Lock, Globe } from "lucide-react";
import { useChatStore } from "@/store/chat";
import { useRepos } from "@/hooks/use-repos";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { RepoSelector } from "@/components/chat/repo-selector";
import { Button } from "@/components/ui/button";
import { getLanguageColor } from "@/lib/language-colors";
import { cn } from "@/lib/utils";
import type { GitHubRepo } from "@/types/github";

export default function ChatPage() {
  const {
    selectedRepo,
    activeConversationId,
    sidebarOpen,
    setSelectedRepo,
    setActiveConversation,
    createConversation,
  } = useChatStore();

  const { allRepos, loading: reposLoading } = useRepos();

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

  // Called by ChatWindow when the first message is sent — creates the conversation
  const handleFirstMessage = React.useCallback(
    (content: string): string => {
      if (!selectedRepo) return "";
      const id = createConversation(selectedRepo, content);
      return id;
    },
    [selectedRepo, createConversation]
  );

  return (
    <div className="flex h-full min-h-0 -m-4 sm:-m-6">
      {/* Conversation sidebar */}
      <ConversationSidebar repos={allRepos} onNewChat={handleNewChat} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
          {/* Sidebar toggle (when closed, it's inside the sidebar component already) */}
          {!sidebarOpen && (
            <div className="h-5 w-px bg-[var(--border)]" />
          )}

          {/* Repo selector */}
          <div className="flex-1 max-w-lg">
            <RepoSelector
              repos={allRepos}
              selected={selectedRepo}
              onSelect={handleSelectRepo}
              onClear={handleClearRepo}
              loading={reposLoading && allRepos.length === 0}
            />
          </div>

          {/* Repo meta pill — visible when selected */}
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

          {/* New chat button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            disabled={!selectedRepo}
            className="gap-1.5 h-8 text-xs shrink-0"
            aria-label="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </Button>
        </div>

        {/* Chat body */}
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
