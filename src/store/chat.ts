"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, ChatMessage } from "@/types/chat";
import type { GitHubRepo } from "@/types/github";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().slice(0, 60);
  return trimmed.length < firstMessage.trim().length ? `${trimmed}…` : trimmed;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  selectedRepo: GitHubRepo | null;
  sidebarOpen: boolean;

  // Repo selection
  setSelectedRepo: (repo: GitHubRepo | null) => void;

  // Sidebar
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Conversation CRUD
  createConversation: (repo: GitHubRepo, firstMessage?: string) => string;
  setActiveConversation: (id: string | null) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;

  // Messages
  addMessage: (conversationId: string, message: Omit<ChatMessage, "id" | "createdAt">) => string;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  appendMessageContent: (conversationId: string, messageId: string, delta: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;

  // Helpers
  getActiveConversation: () => Conversation | null;
  getConversationsByRepo: (repoFullName: string) => Conversation[];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      selectedRepo: null,
      sidebarOpen: true,

      setSelectedRepo: (repo) => set({ selectedRepo: repo }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      createConversation: (repo, firstMessage) => {
        const id = generateId();
        const now = new Date().toISOString();
        const conversation: Conversation = {
          id,
          title: firstMessage ? generateTitle(firstMessage) : `Chat with ${repo.name}`,
          repoFullName: repo.full_name,
          repoOwner: repo.owner.login,
          repoName: repo.name,
          repoBranch: repo.default_branch,
          repoLanguage: repo.language,
          repoPrivate: repo.private,
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          conversations: [conversation, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          ),
        })),

      deleteConversation: (id) =>
        set((s) => {
          const filtered = s.conversations.filter((c) => c.id !== id);
          const newActive =
            s.activeConversationId === id
              ? (filtered[0]?.id ?? null)
              : s.activeConversationId;
          return { conversations: filtered, activeConversationId: newActive };
        }),

      clearAllConversations: () =>
        set({ conversations: [], activeConversationId: null }),

      addMessage: (conversationId, message) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newMessage: ChatMessage = { ...message, id, createdAt: now };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, newMessage],
                  updatedAt: now,
                  title:
                    c.messages.length === 0 && message.role === "user"
                      ? generateTitle(message.content)
                      : c.title,
                }
              : c
          ),
        }));
        return id;
      },

      updateMessage: (conversationId, messageId, updates) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        })),

      appendMessageContent: (conversationId, messageId, delta) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId
                      ? { ...m, content: m.content + delta }
                      : m
                  ),
                }
              : c
          ),
        })),

      deleteMessage: (conversationId, messageId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== messageId),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        })),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },

      getConversationsByRepo: (repoFullName) =>
        get().conversations.filter((c) => c.repoFullName === repoFullName),
    }),
    {
      name: "gh-chatbot-chat",
      partialize: (s) => ({
        conversations: s.conversations,
        activeConversationId: s.activeConversationId,
        selectedRepo: s.selectedRepo,
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
);
