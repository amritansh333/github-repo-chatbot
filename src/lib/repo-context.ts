import type { RepoTreeItem } from "@/types/chat";

const GITHUB_API = "https://api.github.com";

const IGNORED_PATHS = [
  "node_modules",
  "dist",
  "build",
  ".next",
  ".git",
  "coverage",
  "__pycache__",
  ".cache",
  "vendor",
  "target",
  "out",
  ".turbo",
];

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
  ".pdf", ".zip", ".tar", ".gz", ".tgz", ".rar",
  ".ttf", ".woff", ".woff2", ".eot",
  ".mp3", ".mp4", ".wav", ".avi", ".mov",
  ".exe", ".dll", ".so", ".dylib",
  ".lock", ".bin", ".dat",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rb", ".go", ".rs", ".java", ".kt", ".swift",
  ".c", ".cpp", ".h", ".hpp", ".cs",
  ".html", ".css", ".scss", ".sass", ".less",
  ".json", ".yaml", ".yml", ".toml", ".xml",
  ".md", ".mdx", ".txt", ".rst",
  ".sh", ".bash", ".zsh", ".fish",
  ".env.example", ".gitignore", ".dockerignore",
  ".sql", ".graphql", ".prisma",
  ".vue", ".svelte", ".astro",
  "Dockerfile", "Makefile", ".eslintrc", ".prettierrc",
]);

function isIgnored(path: string): boolean {
  return IGNORED_PATHS.some(
    (ignored) => path === ignored || path.startsWith(`${ignored}/`)
  );
}

function isBinary(path: string): boolean {
  const ext = path.includes(".") ? `.${path.split(".").pop()!.toLowerCase()}` : "";
  return BINARY_EXTENSIONS.has(ext);
}

function isText(path: string): boolean {
  const filename = path.split("/").pop() ?? "";
  if (TEXT_EXTENSIONS.has(filename)) return true;
  const ext = filename.includes(".") ? `.${filename.split(".").pop()!.toLowerCase()}` : "";
  return TEXT_EXTENSIONS.has(ext);
}

async function githubFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `GitHub API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface GitTreeResponse {
  sha: string;
  url: string;
  tree: RepoTreeItem[];
  truncated: boolean;
}

export async function fetchRepoTree(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<RepoTreeItem[]> {
  const data = await githubFetch<GitTreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    token
  );
  return data.tree.filter(
    (item) => !isIgnored(item.path) && !isBinary(item.path)
  );
}

interface BlobResponse {
  content: string;
  encoding: string;
}

export async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  if (!isText(path)) return null;
  try {
    const data = await githubFetch<BlobResponse>(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      token
    );
    if (data.encoding === "base64") {
      return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
    }
    return data.content;
  } catch {
    return null;
  }
}

const MAX_FILES = 40;
const MAX_FILE_SIZE = 50_000; // chars
const MAX_TOTAL_CONTEXT = 120_000; // chars

export interface RepoContextSummary {
  tree: string;
  files: Array<{ path: string; content: string }>;
  truncated: boolean;
}

export async function buildRepoContext(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  question: string
): Promise<RepoContextSummary> {
  const tree = await fetchRepoTree(token, owner, repo, branch);

  const treeText = tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .join("\n");

  // Prioritize files relevant to the question
  const questionLower = question.toLowerCase();
  const keywords = questionLower
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["this", "that", "with", "from", "what", "how", "why", "when", "where", "explain", "find", "show"].includes(w));

  const blobs = tree.filter((item) => item.type === "blob");

  const scored = blobs.map((item) => {
    let score = 0;
    const pathLower = item.path.toLowerCase();

    // Priority boosts
    if (pathLower.endsWith("readme.md") || pathLower === "readme.md") score += 100;
    if (pathLower.includes("package.json") && !pathLower.includes("node_modules")) score += 50;
    if (pathLower.endsWith(".env.example")) score += 30;
    if (pathLower.includes("dockerfile") || pathLower.includes("docker-compose")) score += 20;
    if (pathLower.includes("tsconfig") || pathLower.includes("eslint") || pathLower.includes("prettier")) score += 10;

    // Keyword matching
    for (const kw of keywords) {
      if (pathLower.includes(kw)) score += 40;
    }

    // Prefer top-level files
    const depth = item.path.split("/").length;
    score -= depth * 2;

    // Prefer certain extensions
    if (pathLower.endsWith(".ts") || pathLower.endsWith(".tsx")) score += 5;
    if (pathLower.endsWith(".js") || pathLower.endsWith(".jsx")) score += 4;
    if (pathLower.endsWith(".py") || pathLower.endsWith(".go")) score += 4;
    if (pathLower.endsWith(".md")) score += 3;
    if (pathLower.endsWith(".json")) score += 2;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selectedItems = scored.slice(0, MAX_FILES).map((s) => s.item);

  const files: Array<{ path: string; content: string }> = [];
  let totalSize = 0;
  let truncated = false;

  for (const item of selectedItems) {
    if (totalSize >= MAX_TOTAL_CONTEXT) {
      truncated = true;
      break;
    }
    const content = await fetchFileContent(token, owner, repo, item.path);
    if (content) {
      const capped = content.length > MAX_FILE_SIZE ? content.slice(0, MAX_FILE_SIZE) + "\n... (truncated)" : content;
      files.push({ path: item.path, content: capped });
      totalSize += capped.length;
    }
  }

  return { tree: treeText, files, truncated };
}
