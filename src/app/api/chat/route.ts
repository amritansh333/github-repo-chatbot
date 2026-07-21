import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildRepoContext } from "@/lib/repo-context";
import type { ChatMessage } from "@/types/chat";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  repoOwner: string;
  repoName: string;
  repoBranch: string;
  repoLanguage: string | null;
  repoPrivate: boolean;
  githubToken: string;
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
    typeof b.githubToken === "string" &&
    typeof b.conversationId === "string"
  );
}

export async function POST(req: NextRequest): Promise<Response> {
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

  const {
    messages,
    repoOwner,
    repoName,
    repoBranch,
    repoLanguage,
    githubToken,
    conversationId: _conversationId,
  } = body;

  const userMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
  const lastUserMessage = [...userMessages]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMessage) {
    return NextResponse.json({ error: "No user message found." }, { status: 400 });
  }

  // Build repo context server-side using the GitHub token
  let repoContext: Awaited<ReturnType<typeof buildRepoContext>>;
  try {
    repoContext = await buildRepoContext(
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

  const systemInstruction = buildSystemPrompt(
    repoOwner,
    repoName,
    repoBranch,
    repoLanguage,
    repoContext
  );

  // Map conversation history to Gemini Content format.
  // Gemini uses "user" / "model" roles (not "assistant").
  // The system instruction is passed separately via config, so we exclude it here.
  const contents = userMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await ai.models.generateContentStream({
          model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 2048,
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
          encoder.encode(
            `data: ${JSON.stringify({ type: "done" })}\n\n`
          )
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "AI generation failed.";
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
  context: Awaited<ReturnType<typeof buildRepoContext>>
): string {
  const fileBlocks = context.files
    .map((f) => `### File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  return `You are RepoChat, an expert AI code assistant. You have been given access to the GitHub repository **${owner}/${repo}** (branch: \`${branch}\`${
    language ? `, primary language: ${language}` : ""
  }).

Your role is to help developers understand, navigate, and work with this codebase.

## Repository File Tree
\`\`\`
${context.tree}
\`\`\`
${context.truncated ? "\n*(Note: large repository — showing most relevant files only)*\n" : ""}

## Loaded File Contents
${fileBlocks || "*(No text files loaded for this query)*"}

## Instructions
- Answer questions about the repository code, architecture, and structure.
- Reference specific files and line ranges when relevant.
- Use markdown formatting: headings, code blocks with language tags, lists, tables.
- For code examples, always specify the language in fenced code blocks.
- Be concise but thorough. Prioritize accuracy over length.
- If you're not sure about something based on the provided files, say so.
- Do not invent code that doesn't exist in the repository.`;
}
