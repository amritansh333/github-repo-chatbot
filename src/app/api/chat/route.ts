import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "../../../../auth";
import { db } from "@/db";
import { users, userSettings, conversations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptToken } from "@/lib/encryption";
import { buildRepoContext } from "@/lib/repo-context";
import { retrieveRelevantChunks, hasChunks } from "@/lib/rag";
import type { ChatMessage } from "@/types/chat";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not configured.");
  return new GoogleGenAI({ apiKey });
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  repoLanguage: string | null;
  repoPrivate: boolean;
  conversationId: string;
}

function validateBody(body: unknown): body is ChatRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.messages) &&
    typeof b.repoOwner === "string" &&
    typeof b.repoName === "string" &&
    typeof b.repoBranch === "string" &&
    typeof b.conversationId === "string"
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ai: GoogleGenAI;
  try {
    ai = getGeminiClient();
  } catch {
    return NextResponse.json(
      { error: "AI is not configured. Please set the GEMINI_API_KEY environment variable." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!validateBody(body)) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { messages, repoOwner, repoName, repoBranch, repoLanguage, conversationId } = body;
  const repoFullName = `${repoOwner}/${repoName}`;
  const userId = session.user.id;

  // Verify conversation ownership
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    columns: { userId: true },
  });
  if (!conv || conv.userId !== userId) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  // Fetch decrypted GitHub token
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) {
    return NextResponse.json(
      { error: "No GitHub token found. Please add your GitHub Personal Access Token in Settings." },
      { status: 422 }
    );
  }

  let githubToken: string;
  try {
    githubToken = await decryptToken(user.githubAccessToken);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt GitHub token. Please re-add your token in Settings." },
      { status: 500 }
    );
  }

  // Fetch user AI model preference
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
    columns: { aiModel: true },
  });
  const model = settings?.aiModel ?? "gemini-2.5-flash";

  const userMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const lastUserMessage = [...userMessages].reverse().find((m) => m.role === "user");

  if (!lastUserMessage) {
    return NextResponse.json({ error: "No user message found." }, { status: 400 });
  }

  // ── RAG: retrieve semantically relevant chunks ─────────────────────────
  let ragContext = "";
  const repoIsIndexed = await hasChunks(userId, repoFullName, repoBranch);

  if (repoIsIndexed) {
    try {
      const chunks = await retrieveRelevantChunks(
        userId,
        repoFullName,
        repoBranch,
        lastUserMessage.content
      );

      if (chunks.length > 0) {
        ragContext =
          "## Semantically Relevant Code Chunks (ranked by relevance)\n\n" +
          chunks
            .map(
              (c, i) =>
                `### Chunk ${i + 1} — ${c.filePath} (score: ${c.score.toFixed(3)})\n\`\`\`\n${c.content}\n\`\`\``
            )
            .join("\n\n");
      }
    } catch {
      // Non-fatal — fall back to file-based context
    }
  }

  // ── Fallback: file-based context (used when RAG not indexed yet) ────────
  let fileContext: Awaited<ReturnType<typeof buildRepoContext>> | null = null;
  if (!ragContext) {
    try {
      fileContext = await buildRepoContext(
        githubToken,
        repoOwner,
        repoName,
        repoBranch,
        lastUserMessage.content
      );
    } catch (err) {
      return NextResponse.json(
        {
          error: `Failed to load repository context: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
        { status: 502 }
      );
    }
  }

  const systemInstruction = buildSystemPrompt(
    repoOwner,
    repoName,
    repoBranch,
    repoLanguage,
    ragContext,
    fileContext
  );

  const contents = userMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 8192,
          },
        });

        for await (const chunk of result) {
          const delta = chunk.text ?? "";
          if (delta) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`
              )
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI generation failed.";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: msg })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildSystemPrompt(
  owner: string,
  repo: string,
  branch: string,
  language: string | null,
  ragContext: string,
  fileContext: Awaited<ReturnType<typeof buildRepoContext>> | null
): string {
  const repoInfo = `**${owner}/${repo}** (branch: \`${branch}\`${language ? `, primary language: ${language}` : ""})`;

  const contextSection = ragContext
    ? ragContext
    : fileContext
    ? `## Repository File Tree\n\`\`\`\n${fileContext.tree}\n\`\`\`\n${
        fileContext.truncated ? "\n*(large repository — showing most relevant files only)*\n" : ""
      }\n\n## Loaded File Contents\n${
        fileContext.files
          .map((f) => `### File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
          .join("\n\n") || "*(No text files loaded)*"
      }`
    : "*(No repository context available)*";

  const contextMode = ragContext
    ? "using **semantic RAG retrieval** — the most relevant code chunks have been selected for your question"
    : "using **file-based heuristics** — run repository indexing for better semantic search";

  return `You are RepoChat, an expert AI code assistant with deep knowledge of ${repoInfo}.

Your context was assembled ${contextMode}.

${contextSection}

## Instructions
- Answer questions about the repository code, architecture, and structure.
- Reference specific files and line numbers when relevant.
- Use markdown: headings, fenced code blocks with language tags, lists, tables.
- Always specify the language in fenced code blocks.
- Be concise but thorough. Prioritize accuracy.
- If unsure based on the provided context, say so clearly.
- Do not invent code that doesn't exist in the repository.`;
}
