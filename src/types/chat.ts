import type { GitHubRepo } from "./github";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  error?: boolean;
  editedAt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  repoFullName: string;
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  repoLanguage: string | null;
  repoPrivate: boolean;
  pinned: boolean;
  favorited?: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface RepoTreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
  url: string;
}

export interface RepoContext {
  repo: GitHubRepo;
  tree: RepoTreeItem[];
  loadedFiles: Record<string, string>;
}

export interface StreamChunk {
  type: "delta" | "done" | "error";
  content?: string;
  error?: string;
}
