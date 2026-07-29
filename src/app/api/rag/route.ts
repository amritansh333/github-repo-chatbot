import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptToken } from "@/lib/encryption";
import { fetchRepoTree, fetchFileContent } from "@/lib/repo-context";
import { indexRepository, hasChunks } from "@/lib/rag";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";
import { API } from "@/lib/api";

interface RAGRequestBody {
  repoOwner: string;
  repoName: string;
  repoFullName: string;
  repoBranch: string;
  force?: boolean;
}

function validate(body: unknown): body is RAGRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.repoOwner === "string" &&
    typeof b.repoName === "string" &&
    typeof b.repoFullName === "string" &&
    typeof b.repoBranch === "string"
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return API.unauthorized();

  // Rate limit indexing: 5 per minute (expensive operation)
  const rl = rateLimit(getIdentifier(req, session.user.id), { limit: 5, windowMs: 60_000 });
  if (!rl.success) return API.tooManyRequests(rl.resetAt);

  let body: unknown;
  try { body = await req.json(); }
  catch { return API.badRequest("Invalid body"); }

  if (!validate(body)) return API.badRequest("Missing required fields");

  const { repoOwner, repoName, repoFullName, repoBranch, force = false } = body;
  const userId = session.user.id;

  if (!force) {
    const already = await hasChunks(userId, repoFullName, repoBranch);
    if (already) return NextResponse.json({ status: "already_indexed" });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { githubAccessToken: true },
  });
  if (!user?.githubAccessToken) return NextResponse.json({ error: "No GitHub token" }, { status: 422 });

  let githubToken: string;
  try { githubToken = await decryptToken(user.githubAccessToken); }
  catch { return API.internalError("Failed to decrypt token"); }

  let tree: Awaited<ReturnType<typeof fetchRepoTree>>;
  try {
    tree = await fetchRepoTree(githubToken, repoOwner, repoName, repoBranch);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch repo tree: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const blobs = tree.filter((item) => item.type === "blob").slice(0, 150);
  const fileResults = await Promise.allSettled(
    blobs.map((item) => fetchFileContent(githubToken, repoOwner, repoName, item.path))
  );

  const files: Array<{ path: string; content: string }> = [];
  for (let i = 0; i < blobs.length; i++) {
    const result = fileResults[i];
    if (result.status === "fulfilled" && result.value) {
      files.push({ path: blobs[i].path, content: result.value });
    }
  }

  if (files.length === 0) return NextResponse.json({ status: "no_text_files", chunksIndexed: 0 });

  try {
    const { chunksIndexed } = await indexRepository(userId, repoFullName, repoBranch, files);
    return NextResponse.json({ status: "indexed", chunksIndexed, filesIndexed: files.length });
  } catch (err) {
    return NextResponse.json(
      { error: `Indexing failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return API.unauthorized();

  const url = new URL(req.url);
  const repoFullName = url.searchParams.get("repo");
  const repoBranch = url.searchParams.get("branch") ?? "main";

  if (!repoFullName) return API.badRequest("repo param required");

  const indexed = await hasChunks(session.user.id, repoFullName, repoBranch);
  return NextResponse.json({ indexed });
}
