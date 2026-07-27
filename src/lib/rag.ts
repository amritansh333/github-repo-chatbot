/**
 * RAG — Retrieval-Augmented Generation
 * Enhanced: smarter chunking, deduplication, better ranking, efficient caching.
 */
import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { repoChunks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const EMBEDDING_MODEL = "text-embedding-004";
const TOP_K = 14;
const EMBED_BATCH = 20;
const MAX_CHUNKS_PER_REPO = 3000;
const MIN_SCORE = 0.28;

// Priority extensions and their boost factors
const PRIORITY_FILES: Record<string, number> = {
  "readme.md": 3.0, "readme.txt": 2.5, "readme": 2.5,
  "package.json": 2.0, "pyproject.toml": 2.0, "cargo.toml": 2.0,
  "go.mod": 2.0, "pom.xml": 2.0, "build.gradle": 2.0,
  "dockerfile": 1.8, "docker-compose.yml": 1.8, "docker-compose.yaml": 1.8,
  "tsconfig.json": 1.5, ".env.example": 1.5, "schema.prisma": 1.8,
  "schema.ts": 1.8, "schema.sql": 1.8,
};

// File path signals that boost relevance for certain question types
const AUTH_SIGNALS = ["auth", "login", "session", "jwt", "token", "permission", "middleware"];
const DB_SIGNALS = ["model", "schema", "migration", "repository", "entity", "database", "db"];
const API_SIGNALS = ["route", "controller", "handler", "endpoint", "api", "server"];
const COMPONENT_SIGNALS = ["component", "page", "view", "layout", "widget"];

// ── Chunking ──────────────────────────────────────────────────────────────

export interface FileChunk {
  filePath: string;
  chunkIndex: number;
  content: string;
  /** Boost factor applied at ranking time */
  boost: number;
}

function getFileBoost(filePath: string): number {
  const lower = filePath.toLowerCase();
  const filename = lower.split("/").pop() ?? "";

  // Exact filename match
  if (PRIORITY_FILES[filename]) return PRIORITY_FILES[filename];

  // Extension-based boost
  if (filename.endsWith(".md") || filename.endsWith(".mdx")) return 1.6;
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return 1.3;
  if (filename.endsWith(".py") || filename.endsWith(".go") || filename.endsWith(".rs")) return 1.2;
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return 1.1;
  if (filename.endsWith(".json") || filename.endsWith(".yaml") || filename.endsWith(".yml")) return 1.1;

  // Depth penalty — prefer shallow files
  const depth = filePath.split("/").length;
  return Math.max(0.6, 1.0 - depth * 0.05);
}

/**
 * Semantic chunking: splits on logical boundaries (function/class defs, markdown headings)
 * rather than pure character windows.
 */
export function chunkFile(filePath: string, content: string): FileChunk[] {
  const boost = getFileBoost(filePath);
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const chunks: FileChunk[] = [];
  const CHARS = 1600; // ~400 tokens
  const OVERLAP = 320;

  // For markdown: split on headings
  if (ext === "md" || ext === "mdx") {
    const sections = content.split(/(?=^#{1,3} )/m);
    let idx = 0;
    for (const section of sections) {
      if (section.trim().length < 20) continue;
      // Further split large sections
      if (section.length > CHARS * 1.5) {
        let start = 0;
        while (start < section.length) {
          const end = Math.min(start + CHARS, section.length);
          const text = section.slice(start, end).trim();
          if (text.length > 20) {
            chunks.push({ filePath, chunkIndex: idx++, content: `// File: ${filePath}\n${text}`, boost });
          }
          start = end - OVERLAP;
          if (start <= 0) break;
        }
      } else {
        chunks.push({ filePath, chunkIndex: idx++, content: `// File: ${filePath}\n${section.trim()}`, boost });
      }
    }
    return chunks;
  }

  // For code: try to split on top-level function/class boundaries
  const topLevelBoundaries = [
    /^(export\s+)?(async\s+)?function\s+\w+/m,
    /^(export\s+)?(default\s+)?class\s+\w+/m,
    /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/m,
    /^def\s+\w+/m,
    /^class\s+\w+/m,
    /^func\s+\w+/m,
    /^fn\s+\w+/m,
    /^pub\s+(fn|struct|enum|impl)\s+/m,
  ];

  // Try semantic split first
  let lines = content.split("\n");
  let currentChunk: string[] = [];
  let idx = 0;
  let charCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTopLevel = topLevelBoundaries.some((re) => re.test(line));

    if (isTopLevel && charCount > CHARS / 2 && currentChunk.length > 0) {
      const text = currentChunk.join("\n").trim();
      if (text.length > 20) {
        chunks.push({ filePath, chunkIndex: idx++, content: `// File: ${filePath}\n${text}`, boost });
      }
      // Keep OVERLAP chars of context
      const overlap = currentChunk.slice(-Math.ceil(OVERLAP / 40));
      currentChunk = [...overlap];
      charCount = overlap.join("\n").length;
    }

    currentChunk.push(line);
    charCount += line.length + 1;

    if (charCount >= CHARS) {
      const text = currentChunk.join("\n").trim();
      if (text.length > 20) {
        chunks.push({ filePath, chunkIndex: idx++, content: `// File: ${filePath}\n${text}`, boost });
      }
      const overlap = currentChunk.slice(-Math.ceil(OVERLAP / 40));
      currentChunk = [...overlap];
      charCount = overlap.join("\n").length;
    }
  }

  if (currentChunk.length > 0) {
    const text = currentChunk.join("\n").trim();
    if (text.length > 20) {
      chunks.push({ filePath, chunkIndex: idx++, content: `// File: ${filePath}\n${text}`, boost });
    }
  }

  return chunks;
}

export function chunkFiles(files: Array<{ path: string; content: string }>): FileChunk[] {
  // Sort: priority files first
  const sorted = [...files].sort((a, b) => {
    return getFileBoost(b.path) - getFileBoost(a.path);
  });

  const all: FileChunk[] = [];
  const seen = new Set<string>();

  for (const f of sorted) {
    const chunks = chunkFile(f.path, f.content);
    for (const chunk of chunks) {
      // Deduplicate by content fingerprint
      const fp = chunk.content.trim().slice(0, 120);
      if (!seen.has(fp)) {
        seen.add(fp);
        all.push(chunk);
      }
    }
    if (all.length >= MAX_CHUNKS_PER_REPO) break;
  }

  return all.slice(0, MAX_CHUNKS_PER_REPO);
}

// ── Embedding ─────────────────────────────────────────────────────────────

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = getClient();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const res = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: batch,
      config: { taskType: "RETRIEVAL_DOCUMENT" },
    });
    for (const emb of res.embeddings ?? []) {
      results.push(emb.values ?? []);
    }
  }
  return results;
}

export async function embedQuery(query: string): Promise<number[]> {
  const ai = getClient();
  const res = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [query],
    config: { taskType: "RETRIEVAL_QUERY" },
  });
  return res.embeddings?.[0]?.values ?? [];
}

// ── Storage ───────────────────────────────────────────────────────────────

export async function upsertChunks(
  userId: string,
  repoFullName: string,
  repoBranch: string,
  chunks: FileChunk[],
  embeddings: number[][]
): Promise<void> {
  if (chunks.length === 0) return;

  await db.delete(repoChunks).where(
    and(
      eq(repoChunks.userId, userId),
      eq(repoChunks.repoFullName, repoFullName),
      eq(repoChunks.repoBranch, repoBranch)
    )
  );

  const BATCH = 100;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const bc = chunks.slice(i, i + BATCH);
    const be = embeddings.slice(i, i + BATCH);
    await db.insert(repoChunks).values(
      bc.map((chunk, j) => ({
        userId,
        repoFullName,
        repoBranch,
        filePath: chunk.filePath,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: be[j] ?? [],
      }))
    );
  }
}

export async function hasChunks(
  userId: string,
  repoFullName: string,
  repoBranch: string
): Promise<boolean> {
  const row = await db.query.repoChunks.findFirst({
    where: and(
      eq(repoChunks.userId, userId),
      eq(repoChunks.repoFullName, repoFullName),
      eq(repoChunks.repoBranch, repoBranch)
    ),
    columns: { id: true },
  });
  return row !== undefined;
}

// ── Cosine similarity ─────────────────────────────────────────────────────

function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Detect question intent to boost signal-relevant files */
function getQueryBoostSignals(query: string): string[] {
  const q = query.toLowerCase();
  const signals: string[] = [];
  if (AUTH_SIGNALS.some((s) => q.includes(s))) signals.push(...AUTH_SIGNALS);
  if (DB_SIGNALS.some((s) => q.includes(s))) signals.push(...DB_SIGNALS);
  if (API_SIGNALS.some((s) => q.includes(s))) signals.push(...API_SIGNALS);
  if (COMPONENT_SIGNALS.some((s) => q.includes(s))) signals.push(...COMPONENT_SIGNALS);
  return signals;
}

// ── Retrieval ─────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  filePath: string;
  content: string;
  score: number;
}

export async function retrieveRelevantChunks(
  userId: string,
  repoFullName: string,
  repoBranch: string,
  query: string,
  topK = TOP_K
): Promise<RetrievedChunk[]> {
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(query);
  } catch {
    return [];
  }

  if (queryEmbedding.length === 0) return [];

  const rows = await db.query.repoChunks.findMany({
    where: and(
      eq(repoChunks.userId, userId),
      eq(repoChunks.repoFullName, repoFullName),
      eq(repoChunks.repoBranch, repoBranch)
    ),
    columns: { filePath: true, content: true, embedding: true },
  });

  if (rows.length === 0) return [];

  const boostSignals = getQueryBoostSignals(query);
  const seenContent = new Set<string>();

  const scored = rows
    .map((row) => {
      const cosine = cosineSim(queryEmbedding, row.embedding as number[]);
      // Apply path-based boost for signal-relevant files
      const pathLower = row.filePath.toLowerCase();
      const signalBoost = boostSignals.some((s) => pathLower.includes(s)) ? 1.2 : 1.0;
      return {
        filePath: row.filePath,
        content: row.content,
        score: cosine * signalBoost,
      };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      // Deduplicate by content fingerprint
      const fp = r.content.trim().slice(0, 80);
      if (seenContent.has(fp)) return false;
      seenContent.add(fp);
      return true;
    })
    .slice(0, topK);

  // Diversify: max 3 chunks per file to avoid one file dominating
  const fileCounts: Record<string, number> = {};
  return scored.filter((r) => {
    fileCounts[r.filePath] = (fileCounts[r.filePath] ?? 0) + 1;
    return fileCounts[r.filePath] <= 3;
  });
}

// ── Indexing pipeline ─────────────────────────────────────────────────────

export async function indexRepository(
  userId: string,
  repoFullName: string,
  repoBranch: string,
  files: Array<{ path: string; content: string }>
): Promise<{ chunksIndexed: number }> {
  const chunks = chunkFiles(files);
  if (chunks.length === 0) return { chunksIndexed: 0 };

  const texts = chunks.map((c) => c.content);
  const embeddings = await embedTexts(texts);

  await upsertChunks(userId, repoFullName, repoBranch, chunks, embeddings);
  return { chunksIndexed: chunks.length };
}
