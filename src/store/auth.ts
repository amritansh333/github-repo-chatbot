"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GitHubUser } from "@/types/github";

interface AuthState {
  token: string | null;
  user: GitHubUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: GitHubUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: true }),
      clearAuth: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "gh-chatbot-auth",
      // Only persist token and user — not derived state
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
