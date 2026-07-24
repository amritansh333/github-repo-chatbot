"use client";

import { useSession, signOut } from "next-auth/react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chat";
import { useReposStore } from "@/store/repos";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setConversations = useChatStore((s) => s.setConversations);
  const clearRepos = useReposStore((s) => s.clearRepos);

  const logout = useCallback(async () => {
    // Clear local state before signing out
    setConversations([]);
    clearRepos();
    await signOut({ callbackUrl: "/" });
  }, [setConversations, clearRepos]);

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    logout,
  };
}
