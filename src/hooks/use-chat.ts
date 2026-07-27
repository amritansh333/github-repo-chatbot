"use client";

import * as React from "react";
import { useChatStore } from "@/store/chat";
import type { ChatMessage } from "@/types/chat";
import type { GitHubRepo } from "@/types/github";

interface UseChatOptions {
  conversationId: string | null;
  repo: GitHubRepo | null;
}

async function persistMessages(
  conversationId: string,
  msgs: Array<{ role: string; content: string }>
): Promise<void> {
  try {
    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    });
  } catch { /* non-fatal */ }
}

export function useChat({ conversationId, repo }: UseChatOptions) {
  const {
    conversations, addMessage, updateMessage, appendMessageContent,
    deleteMessage, editMessage, upsertConversation,
  } = useChatStore();

  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const conversation = React.useMemo(
    () => conversations.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId]
  );

  const messages = conversation?.messages ?? [];

  const stopStreaming = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    if (conversationId) {
      const conv = useChatStore.getState().conversations.find((c) => c.id === conversationId);
      const last = conv?.messages.findLast((m) => m.isStreaming);
      if (last) updateMessage(conversationId, last.id, { isStreaming: false });
    }
  }, [conversationId, updateMessage]);

  const sendMessage = React.useCallback(
    async (content: string, retryAssistantId?: string) => {
      if (!repo || !conversationId || isStreaming) return;
      setError(null);

      if (retryAssistantId) deleteMessage(conversationId, retryAssistantId);

      const userContent = retryAssistantId
        ? (useChatStore.getState().conversations.find((c) => c.id === conversationId)
            ?.messages.findLast((m) => m.role === "user")?.content ?? content)
        : content;

      if (!retryAssistantId) addMessage(conversationId, { role: "user", content });

      const assistantId = addMessage(conversationId, { role: "assistant", content: "", isStreaming: true });
      setIsStreaming(true);

      const currentConv = useChatStore.getState().conversations.find((c) => c.id === conversationId);
      const messagesToSend: ChatMessage[] = (currentConv?.messages ?? []).filter(
        (m) => m.id !== assistantId && !m.isStreaming
      );

      const controller = new AbortController();
      abortRef.current = controller;
      let finalContent = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: messagesToSend,
            repoOwner: repo.owner.login,
            repoName: repo.name,
            repoBranch: repo.default_branch,
            repoLanguage: repo.language,
            repoPrivate: repo.private,
            conversationId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error ?? `Server error: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream.");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const chunk = JSON.parse(raw) as { type: string; content?: string; error?: string };
              if (chunk.type === "delta" && chunk.content) {
                finalContent += chunk.content;
                appendMessageContent(conversationId, assistantId, chunk.content);
              } else if (chunk.type === "done") {
                updateMessage(conversationId, assistantId, { isStreaming: false });
              } else if (chunk.type === "error") {
                throw new Error(chunk.error ?? "AI error");
              }
            } catch (pe) {
              if (pe instanceof SyntaxError) continue;
              throw pe;
            }
          }
        }

        updateMessage(conversationId, assistantId, { isStreaming: false });

        const toSave: Array<{ role: string; content: string }> = [];
        if (!retryAssistantId) toSave.push({ role: "user", content: userContent });
        if (finalContent) toSave.push({ role: "assistant", content: finalContent });
        if (toSave.length > 0) void persistMessages(conversationId, toSave);

        const updatedConv = useChatStore.getState().conversations.find((c) => c.id === conversationId);
        if (updatedConv) upsertConversation({ ...updatedConv, updatedAt: new Date().toISOString() });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          updateMessage(conversationId, assistantId, { isStreaming: false });
          const toSave: Array<{ role: string; content: string }> = [];
          if (!retryAssistantId) toSave.push({ role: "user", content: userContent });
          if (finalContent) toSave.push({ role: "assistant", content: finalContent });
          if (toSave.length > 0) void persistMessages(conversationId, toSave);
          return;
        }
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        updateMessage(conversationId, assistantId, { isStreaming: false, error: true, content: msg });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [repo, conversationId, isStreaming, addMessage, updateMessage, appendMessageContent, deleteMessage, upsertConversation]
  );

  const retryLast = React.useCallback(() => {
    if (!conversationId) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastAssistant || !lastUser) return;
    void sendMessage(lastUser.content, lastAssistant.id);
  }, [messages, conversationId, sendMessage]);

  const editAndResend = React.useCallback(
    (messageId: string, newContent: string) => {
      if (!conversationId) return;
      editMessage(conversationId, messageId, newContent);
      // Remove all messages after the edited one
      const conv = useChatStore.getState().conversations.find((c) => c.id === conversationId);
      if (!conv) return;
      const idx = conv.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      const toRemove = conv.messages.slice(idx + 1);
      toRemove.forEach((m) => deleteMessage(conversationId, m.id));
      void sendMessage(newContent);
    },
    [conversationId, editMessage, deleteMessage, sendMessage]
  );

  return {
    messages,
    conversation,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    retryLast,
    editAndResend,
    deleteMessage: (id: string) => conversationId && deleteMessage(conversationId, id),
  };
}
