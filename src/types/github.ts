export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  default_branch: string;
  topics: string[];
  visibility: "public" | "private" | "internal";
  created_at: string;
  updated_at: string;
  pushed_at: string;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
}

export interface GitHubRepoDetails extends GitHubRepo {
  subscribers_count: number;
  network_count: number;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_downloads: boolean;
  homepage: string | null;
}

export interface GitHubLanguages {
  [language: string]: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
    url: string;
  };
}

export type SortOption = "updated" | "name" | "stars" | "forks" | "created";
export type SortDirection = "asc" | "desc";

export interface RepoFilters {
  search: string;
  sort: SortOption;
  direction: SortDirection;
  language: string;
  visibility: "all" | "public" | "private";
}
