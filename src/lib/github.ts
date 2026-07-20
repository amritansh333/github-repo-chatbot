import type {
  GitHubUser,
  GitHubRepo,
  GitHubRepoDetails,
  GitHubLanguages,
  GitHubCommit,
  GitHubBranch,
  SortDirection,
} from "@/types/github";

const GITHUB_API = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

async function githubFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GitHubApiError(
      res.status,
      (body as { message?: string }).message ?? `GitHub API error: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

export async function validateToken(token: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>("/user", token);
}

export type ApiSortOption = "updated" | "created" | "full_name" | "pushed";

export async function fetchUserRepos(
  token: string,
  options: {
    sort?: ApiSortOption;
    direction?: SortDirection;
    per_page?: number;
    page?: number;
    visibility?: "all" | "public" | "private";
  } = {}
): Promise<GitHubRepo[]> {
  const params = new URLSearchParams({
    sort: options.sort ?? "updated",
    direction: options.direction ?? "desc",
    per_page: String(options.per_page ?? 100),
    page: String(options.page ?? 1),
    affiliation: "owner,collaborator,organization_member",
  });

  if (options.visibility && options.visibility !== "all") {
    params.set("visibility", options.visibility);
  }

  return githubFetch<GitHubRepo[]>(`/user/repos?${params}`, token);
}

export async function fetchRepo(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubRepoDetails> {
  return githubFetch<GitHubRepoDetails>(`/repos/${owner}/${repo}`, token);
}

export async function fetchRepoLanguages(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubLanguages> {
  return githubFetch<GitHubLanguages>(
    `/repos/${owner}/${repo}/languages`,
    token
  );
}

export async function fetchRepoCommits(
  token: string,
  owner: string,
  repo: string,
  per_page = 10
): Promise<GitHubCommit[]> {
  return githubFetch<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits?per_page=${per_page}`,
    token
  );
}

export async function fetchRepoBranches(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  return githubFetch<GitHubBranch[]>(
    `/repos/${owner}/${repo}/branches?per_page=100`,
    token
  );
}
