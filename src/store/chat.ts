"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, ChatMessage } from "@/types/chat";
import type { GitHubRepo } from "@/types/github";

function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateTitle(msg: string): string {
  const t = msg.trim().slice(0, 60);
  return t.length < msg.trim().length ? `${t}…` : t;
}

function sortByUpdated(convs: Conversation[]): Conversation[] {
  return [...convs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  selectedRepo: GitHubRepo | null;
  sidebarOpen: boolean;
  sidebarSearch: string;

  setSelectedRepo: (repo: GitHubRepo | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarSearch: (q: string) => void;

  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  upsertConversation: (conv: Conversation) => void;
  removeConversation: (id: string) => void;

  addMessage: (conversationId: string, message: Omit<ChatMessage, "id" | "createdAt">) => string;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  appendMessageContent: (conversationId: string, messageId: string, delta: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  editMessage: (conversationId: string, messageId: string, content: string) => void;

  getActiveConversation: () => Conversation | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      selectedRepo: null,
      sidebarOpen: true,
      sidebarSearch: "",

      setSelectedRepo: (repo) => set({ selectedRepo: repo }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarSearch: (q) => set({ sidebarSearch: q }),

      setConversations: (conversations) =>
        set({ conversations: sortByUpdated(conversations) }),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      upsertConversation: (conv) =>
        set((s) => {
          const exists = s.conversations.some((c) => c.id === conv.id);
          const updated = exists
            ? s.conversations.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
            : [conv, ...s.conversations];
          return { conversations: sortByUpdated(updated) };
        }),

      removeConversation: (id) =>
        set((s) => {
          const filtered = s.conversations.filter((c) => c.id !== id);
          return {
            conversations: filtered,
            activeConversationId:
              s.activeConversationId === id ? (filtered[0]?.id ?? null) : s.activeConversationId,
          };
        }),

      addMessage: (conversationId, message) => {
        const id = generateLocalId();
        const now = new Date().toISOString();
        const newMessage: ChatMessage = { ...message, id, createdAt: now };
        set((s) => {
          const updated = s.conversations.map((c) =>
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
          );
          return { conversations: sortByUpdated(updated) };
        });
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
                    m.id === messageId ? { ...m, content: m.content + delta } : m
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

      editMessage: (conversationId, messageId, content) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId
                      ? { ...m, content, editedAt: new Date().toISOString() }
                      : m
                  ),
                }
              : c
          ),
        })),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },
    }),
    {
      name: "gh-chatbot-ui",
      partialize: (s) => ({
        selectedRepo: s.selectedRepo,
        sidebarOpen: s.sidebarOpen,
        activeConversationId: s.activeConversationId,
      }),
    }
  )
);
