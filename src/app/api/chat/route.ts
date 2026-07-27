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
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured.");
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
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let ai: GoogleGenAI;
  try { ai = getGeminiClient(); }
  catch { return NextResponse.json({ error: "AI not configured. Set GEMINI_API_KEY." }, { status: 503 }); }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  if (!validateBody(body)) return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

  const { messages, repoOwner, repoName, repoBranch, repoLanguage, conversationId } = body;
  const repoFullName = `${repoOwner}/${repoName}`;
  const userId = session.user.id;

  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    columns: { userId: true },
  });
  if (!conv || conv.userId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { githubAccessToken: true },
  });
  if (!user?.githubAccessToken) {
    return NextResponse.json({ error: "No GitHub token. Add it in Settings." }, { status: 422 });
  }

  let githubToken: string;
  try { githubToken = await decryptToken(user.githubAccessToken); }
  catch { return NextResponse.json({ error: "Failed to decrypt GitHub token." }, { status: 500 }); }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
    columns: { aiModel: true },
  });
  const model = settings?.aiModel ?? "gemini-2.5-flash";

  const userMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const lastUserMessage = [...userMessages].reverse().find((m) => m.role === "user");
  if (!lastUserMessage) return NextResponse.json({ error: "No user message found." }, { status: 400 });

  // RAG retrieval
  let ragContext = "";
  const repoIsIndexed = await hasChunks(userId, repoFullName, repoBranch);

  if (repoIsIndexed) {
    try {
      const chunks = await retrieveRelevantChunks(userId, repoFullName, repoBranch, lastUserMessage.content);
      if (chunks.length > 0) {
        ragContext =
          "## Semantically Retrieved Code (ranked by relevance to your question)\n\n" +
          chunks
            .map((c, i) =>
              `### [${i + 1}] ${c.filePath} — relevance: ${(c.score * 100).toFixed(0)}%\n\`\`\`\n${c.content}\n\`\`\``
            )
            .join("\n\n");
      }
    } catch { /* fall through to file context */ }
  }

  let fileContext: Awaited<ReturnType<typeof buildRepoContext>> | null = null;
  if (!ragContext) {
    try {
      fileContext = await buildRepoContext(githubToken, repoOwner, repoName, repoBranch, lastUserMessage.content);
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to load repo context: ${err instanceof Error ? err.message : String(err)}` },
        { status: 502 }
      );
    }
  }

  const systemInstruction = buildSystemPrompt(repoOwner, repoName, repoBranch, repoLanguage, ragContext, fileContext);

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
          config: { systemInstruction, temperature: 0.2, maxOutputTokens: 8192 },
        });
        for await (const chunk of result) {
          const delta = chunk.text ?? "";
          if (delta) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI generation failed.";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

function buildSystemPrompt(
  owner: string, repo: string, branch: string, language: string | null,
  ragContext: string,
  fileContext: Awaited<ReturnType<typeof buildRepoContext>> | null
): string {
  const repoInfo = `**${owner}/${repo}** (branch: \`${branch}\`${language ? `, primary language: ${language}` : ""})`;
  const contextMode = ragContext
    ? "🔍 **Semantic RAG** — top-ranked chunks retrieved for your specific question"
    : "📂 **File heuristics** — run indexing for better semantic search";

  const contextBody = ragContext
    ? ragContext
    : fileContext
    ? `## Repository File Tree\n\`\`\`\n${fileContext.tree}\n\`\`\`\n${fileContext.truncated ? "\n> ⚠️ Large repo — showing most relevant files only\n" : ""}\n\n## File Contents\n${
        fileContext.files.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n") || "*(No files loaded)*"
      }`
    : "*(No context available)*";

  return `You are **RepoChat**, an expert AI code assistant for ${repoInfo}.

Context mode: ${contextMode}

${contextBody}

---

## How to answer

**For architecture questions:**
- Give a high-level overview first, then drill down
- Reference specific files and directories
- Explain data flow and component relationships
- Use diagrams in text form when helpful (e.g. ASCII tree)

**For code questions:**
- Always show the relevant file path above code blocks
- Explain what the code does and why
- Highlight any patterns, gotchas, or important details
- If multiple approaches exist, compare them

**For "find X" questions:**
- State exactly where X is located (file + line hint)
- Explain how it works
- Show the key code excerpt

**Formatting rules:**
- Use \`\`\`language fenced blocks with correct language tag
- Use **bold** for file paths and key terms
- Use headings to structure long answers
- Keep answers focused — don't pad with filler text
- If unsure, say so. Never invent code that doesn't exist.`;
}
