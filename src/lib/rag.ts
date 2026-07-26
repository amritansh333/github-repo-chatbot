/**
 * RAG — Retrieval-Augmented Generation
 *
 * Pipeline:
 *  1. Chunking   — split file content into overlapping text chunks
 *  2. Embedding  — embed each chunk with text-embedding-004 (Gemini)
 *  3. Storage    — persist chunks + embeddings in PostgreSQL (JSONB)
 *  4. Retrieval  — cosine similarity search at query time (in JS)
 *  5. Context    — inject top-K chunks into the Gemini system prompt
 */

import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { repoChunks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ── Constants ──────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = "text-embedding-004";
const CHUNK_SIZE = 400;       // tokens ≈ chars / 4 — target ~400 tokens per chunk
const CHUNK_OVERLAP = 80;     // overlap in chars to preserve context at boundaries
const CHARS_PER_CHUNK = CHUNK_SIZE * 4;
const OVERLAP_CHARS = CHUNK_OVERLAP * 4;
const TOP_K = 12;              // chunks returned per query
const EMBED_BATCH = 20;        // chunks per embedding API call
const MAX_CHUNKS_PER_REPO = 2000; // safety cap

// ── Chunking ───────────────────────────────────────────────────────────────

export interface FileChunk {
  filePath: string;
  chunkIndex: number;
  content: string;
}

/**
 * Split a single file's text into overlapping character windows.
 * Tries to break on newlines to avoid cutting mid-statement.
 */
export function chunkFile(filePath: string, content: string): FileChunk[] {
  const chunks: FileChunk[] = [];
  let start = 0;
  let idx = 0;

  while (start < content.length) {
    let end = Math.min(start + CHARS_PER_CHUNK, content.length);

    // Snap to nearest newline (within 200 chars) to avoid mid-line splits
    if (end < content.length) {
      const nlPos = content.lastIndexOf("\n", end);
      if (nlPos > start + CHARS_PER_CHUNK / 2) end = nlPos + 1;
    }

    const text = content.slice(start, end).trim();
    if (text.length > 20) {
      // Prefix with file path for context
      chunks.push({
        filePath,
        chunkIndex: idx++,
        content: `// File: ${filePath}\n${text}`,
      });
    }

    start = end - OVERLAP_CHARS;
    if (start <= 0) break;
  }

  return chunks;
}

export function chunkFiles(
  files: Array<{ path: string; content: string }>
): FileChunk[] {
  const all: FileChunk[] = [];
  for (const f of files) {
    const chunks = chunkFile(f.path, f.content);
    all.push(...chunks);
    if (all.length >= MAX_CHUNKS_PER_REPO) break;
  }
  return all.slice(0, MAX_CHUNKS_PER_REPO);
}

// ── Embedding ──────────────────────────────────────────────────────────────

function getEmbeddingClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

/**
 * Embed an array of text strings in batches.
 * Returns a parallel array of float[] embeddings.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const ai = getEmbeddingClient();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const res = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: batch,
      config: { taskType: "RETRIEVAL_DOCUMENT" },
    });

    const embeddings = res.embeddings ?? [];
    for (const emb of embeddings) {
      results.push(emb.values ?? []);
    }
  }

  return results;
}

export async function embedQuery(query: string): Promise<number[]> {
  const ai = getEmbeddingClient();
  const res = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [query],
    config: { taskType: "RETRIEVAL_QUERY" },
  });
  return res.embeddings?.[0]?.values ?? [];
}

// ── Storage ────────────────────────────────────────────────────────────────

export async function upsertChunks(
  userId: string,
  repoFullName: string,
  repoBranch: string,
  chunks: FileChunk[],
  embeddings: number[][]
): Promise<void> {
  if (chunks.length === 0) return;

  // Delete existing chunks for this repo+branch+user before inserting fresh ones
  await db
    .delete(repoChunks)
    .where(
      and(
        eq(repoChunks.userId, userId),
        eq(repoChunks.repoFullName, repoFullName),
        eq(repoChunks.repoBranch, repoBranch)
      )
    );

  // Insert in batches of 100
  const BATCH = 100;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batchChunks = chunks.slice(i, i + BATCH);
    const batchEmbeddings = embeddings.slice(i, i + BATCH);

    await db.insert(repoChunks).values(
      batchChunks.map((chunk, j) => ({
        userId,
        repoFullName,
        repoBranch,
        filePath: chunk.filePath,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: batchEmbeddings[j] ?? [],
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

// ── Cosine similarity ──────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
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

// ── Retrieval ──────────────────────────────────────────────────────────────

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
  // Embed query
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(query);
  } catch {
    return []; // graceful degradation — fall back to file-based context
  }

  if (queryEmbedding.length === 0) return [];

  // Load all chunks for this repo from DB
  const rows = await db.query.repoChunks.findMany({
    where: and(
      eq(repoChunks.userId, userId),
      eq(repoChunks.repoFullName, repoFullName),
      eq(repoChunks.repoBranch, repoBranch)
    ),
    columns: { filePath: true, content: true, embedding: true },
  });

  if (rows.length === 0) return [];

  // Score each chunk
  const scored = rows
    .map((row) => ({
      filePath: row.filePath,
      content: row.content,
      score: cosineSimilarity(queryEmbedding, row.embedding as number[]),
    }))
    .filter((r) => r.score > 0.3) // minimum relevance threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

// ── Full indexing pipeline ─────────────────────────────────────────────────

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
